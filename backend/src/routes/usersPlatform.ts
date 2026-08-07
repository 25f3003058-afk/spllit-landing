import { Router, Response } from 'express';

import prisma from '../utils/prisma.js';
import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail, boundingBox } from '../utils/respond.js';
import { calculateDistanceMetres, hashPhone } from '../utils/helpers.js';
import { getLivePosition } from '../services/live.js';
import { verifyFirebaseIdToken, isFirebaseAdminConfigured } from '../utils/firebaseAdmin.js';
import {
  emailMatchesInstitute,
  isKnownInstitute,
  institutePrimaryDomain,
} from '../data/institutes.js';

const router = Router();

/**
 * Platform user endpoints for the web app.
 *
 * Mounted on /api/users BEFORE the legacy router so these specific paths match
 * before its catch-all /:id route. The legacy GET /me and PUT /me are left
 * untouched for existing clients; the web app uses /me/profile below, which
 * returns the full profile in the { success, data } envelope.
 */

const PROFILE_FIELDS = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  bio: true,
  college: true,
  gender: true,
  profilePhoto: true,
  rating: true,
  totalRides: true,
  homeCity: true,
  onboarded: true,
  role: true,
  instituteId: true,
  instituteEmail: true,
  instituteVerified: true,
  createdAt: true,
} as const;

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/**
 * Handles that must never belong to a person, because seeing them next to a
 * message would imply the message came from us.
 */
const RESERVED_USERNAMES = new Set([
  'admin', 'admins', 'administrator', 'spllit', 'spllitapp', 'official',
  'support', 'help', 'staff', 'team', 'moderator', 'mod', 'root', 'system',
  'security', 'billing', 'api', 'me', 'you', 'null', 'undefined', 'anonymous',
]);

function sanitizeUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
}

type UsernameRejection = 'invalid' | 'reserved' | 'taken';

/**
 * Candidate handles for someone whose first choice is gone, best first.
 *
 * Generated locally rather than probed one at a time so the whole set can be
 * checked in a single query — the cost is one round trip no matter how many
 * suggestions are asked for.
 *
 * Name-derived forms lead deliberately: `meerakrishnan` reads like a person,
 * `meera7429` reads like a queue ticket. Numeric fallbacks only exist so the
 * list is never empty for a very common stem.
 */
function usernameCandidates(base: string, fullName: string): string[] {
  const out: string[] = [];
  const push = (value: string) => {
    const clean = sanitizeUsername(value);
    if (
      USERNAME_PATTERN.test(clean) &&
      !RESERVED_USERNAMES.has(clean) &&
      clean !== base &&
      !out.includes(clean)
    ) {
      out.push(clean);
    }
  };

  const parts = fullName.toLowerCase().split(/\s+/).map(sanitizeUsername).filter(Boolean);
  const first = parts[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1] as string) : '';

  if (first && last) {
    push(first + last);
    push(`${first}_${last}`);
    push(first + last[0]);
    push(first[0] + last);
  }

  // Trimmed to 17 so there is always room for a suffix inside the 20-char cap.
  const stem = (base || first || 'spllit').slice(0, 17);
  const year = new Date().getFullYear() % 100;

  push(`${stem}${year}`);
  for (const suffix of [1, 2, 3, 7, 9]) push(`${stem}${suffix}`);
  for (const suffix of [1, 2, 3]) push(`${stem}_${suffix}`);
  push(`its${stem}`);
  push(`${stem}_x`);
  push(`real${stem}`);

  // Widen the pool only if everything readable is gone.
  for (let i = 0; i < 8; i += 1) {
    push(`${stem}${100 + Math.floor(Math.random() * 900)}`);
  }

  return out;
}

/** Filters candidates down to the ones nobody holds, preserving priority order. */
async function firstFreeUsernames(
  candidates: string[],
  selfId: string,
  limit: number,
): Promise<string[]> {
  if (candidates.length === 0) return [];

  const taken = await prisma.user.findMany({
    where: { username: { in: candidates }, NOT: { id: selfId } },
    select: { username: true },
  });
  const takenSet = new Set(taken.map((user) => user.username));

  return candidates.filter((candidate) => !takenSet.has(candidate)).slice(0, limit);
}

/**
 * POST /api/users/me/bootstrap
 *
 * Exchanges a verified Firebase identity for a local profile, creating it on
 * first sign-in. This is the one endpoint that cannot use `identify`, because
 * `identify` 404s precisely when no profile exists yet — which is the case this
 * handler is here to resolve.
 *
 * Idempotent: calling it again returns the existing profile untouched.
 */
router.post('/me/bootstrap', async (req: AuthRequest, res: Response) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return fail(res, 401, 'Authentication required');
    }
    if (!isFirebaseAdminConfigured()) {
      return fail(res, 503, 'Sign-in is not configured on this environment');
    }

    const decoded = await verifyFirebaseIdToken(header.substring(7));
    const email = decoded.email ?? `${decoded.uid}@firebase.local`;

    let user = await prisma.user.findFirst({
      where: { OR: [{ firebaseUid: decoded.uid }, { email }] },
      select: PROFILE_FIELDS,
    });

    if (user) {
      // Adopt the uid on accounts that predate the firebaseUid column.
      await prisma.user.updateMany({
        where: { id: user.id, firebaseUid: null },
        data: { firebaseUid: decoded.uid },
      });
      return ok(res, user);
    }

    user = await prisma.user.create({
      data: {
        firebaseUid: decoded.uid,
        email,
        name: decoded.name ?? email.split('@')[0] ?? 'Spllit member',
        // phoneHash is a required unique column. Until the user verifies a real
        // number during onboarding, the uid stands in so the row is valid
        // without colliding with anyone else's.
        phoneHash: hashPhone(decoded.uid),
        phone: decoded.phone_number ?? null,
        phoneVerified: Boolean(decoded.phone_number),
        emailVerified: Boolean(decoded.email_verified),
        profilePhoto: decoded.picture ?? null,
        college: '',
        gender: 'unspecified',
        // Onboarding is not finished until username and college are set.
        onboarded: false,
      },
      select: PROFILE_FIELDS,
    });

    return ok(res, user, 201);
  } catch (error) {
    console.error('[users/me/bootstrap]', error);
    return fail(res, 401, 'Could not verify your sign-in');
  }
});

/** GET /api/users/me/profile */
router.get('/me/profile', identify, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: PROFILE_FIELDS,
    });
    if (!user) return fail(res, 404, 'Profile not found', 'no-profile');
    return ok(res, user);
  } catch (error) {
    console.error('[users/me/profile]', error);
    return fail(res, 500, 'Failed to load profile');
  }
});

/** PATCH /api/users/me/profile */
router.patch('/me/profile', identify, async (req: AuthRequest, res: Response) => {
  try {
    const { name, bio, college, profilePhoto } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
        ...(typeof bio === 'string' ? { bio: bio.trim() || null } : {}),
        ...(typeof college === 'string' && college.trim() ? { college: college.trim() } : {}),
        ...(typeof profilePhoto === 'string' ? { profilePhoto: profilePhoto || null } : {}),
      },
      select: PROFILE_FIELDS,
    });
    return ok(res, user);
  } catch (error) {
    console.error('[users/me/profile PATCH]', error);
    return fail(res, 500, 'Failed to update profile');
  }
});

/**
 * GET /api/users/username-available?username=…&name=…
 *
 * Case-insensitive, and treats the caller's own username as available so the
 * onboarding form does not flag a user against themselves on a resume.
 *
 * When the answer is no it also returns free alternatives, in the same
 * response. `name` is optional and only shapes those suggestions — a full name
 * yields handles that read like a person instead of a numbered stem.
 *
 * `reason` distinguishes the three ways a handle can be refused. Collapsing
 * them into one boolean is what made the form tell people a username they had
 * merely typed too many characters of was "taken".
 */
router.get('/username-available', identify, async (req: AuthRequest, res: Response) => {
  try {
    const username = sanitizeUsername(String(req.query.username ?? '').trim());
    const fullName = String(req.query.name ?? '');

    let reason: UsernameRejection;

    if (!USERNAME_PATTERN.test(username)) {
      reason = 'invalid';
    } else if (RESERVED_USERNAMES.has(username)) {
      reason = 'reserved';
    } else {
      // findFirst, not findUnique: username is unique via a sparse index in
      // MongoDB (see prisma/indexes.mjs), not via Prisma's @unique.
      const existing = await prisma.user.findFirst({
        where: { username },
        select: { id: true },
      });
      if (!existing || existing.id === req.user!.userId) {
        return ok(res, { available: true, reason: null, suggestions: [] });
      }
      reason = 'taken';
    }

    // Nothing usable to build on — an unusable stem would only produce
    // unusable suggestions, so return the verdict alone.
    const suggestions =
      reason === 'invalid' && username.length < 2 && !fullName.trim()
        ? []
        : await firstFreeUsernames(
            usernameCandidates(username, fullName),
            req.user!.userId,
            3,
          );

    return ok(res, { available: false, reason, suggestions });
  } catch (error) {
    console.error('[users/username-available]', error);
    return fail(res, 500, 'Failed to check username');
  }
});

/**
 * POST /api/users/me/onboarding
 * Completes the first-run profile. Idempotent: running it again just updates
 * the same fields, which is what makes "resume where you left off" safe.
 */
router.post('/me/onboarding', identify, async (req: AuthRequest, res: Response) => {
  const username = sanitizeUsername(String(req.body.username ?? '').trim());
  const fullName = String(req.body.name ?? '').trim();

  /** 409 body carrying alternatives, so the form can offer them immediately. */
  const usernameConflict = async (message: string) => {
    const suggestions = await firstFreeUsernames(
      usernameCandidates(username, fullName),
      req.user!.userId,
      3,
    );
    return res
      .status(409)
      .json({ success: false, message, code: 'username-taken', suggestions });
  };

  try {
    const college = String(req.body.college ?? '').trim();
    const phone = String(req.body.phone ?? '').trim();

    if (!USERNAME_PATTERN.test(username)) {
      return fail(res, 400, 'Usernames are 3–20 characters: letters, numbers and underscores');
    }
    if (RESERVED_USERNAMES.has(username)) {
      return usernameConflict('That username is reserved');
    }
    if (college.length < 2) {
      return fail(res, 400, 'Please enter your college');
    }

    const taken = await prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });
    if (taken && taken.id !== req.user!.userId) {
      return usernameConflict('That username is taken');
    }

    const instituteId =
      typeof req.body.instituteId === 'string' && isKnownInstitute(req.body.instituteId)
        ? req.body.instituteId
        : null;

    // If the sign-in address already belongs to the chosen institute, verify
    // immediately — most campus Google accounts do, and asking again would be
    // pointless friction.
    const signInEmail = req.user!.email;
    const autoVerified =
      instituteId !== null && emailMatchesInstitute(signInEmail, instituteId);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        username,
        college,
        instituteId,
        ...(autoVerified
          ? { instituteEmail: signInEmail.toLowerCase(), instituteVerified: true }
          : {}),
        ...(phone ? { phone } : {}),
        ...(fullName ? { name: fullName } : {}),
        ...(req.body.profilePhoto ? { profilePhoto: String(req.body.profilePhoto) } : {}),
        ...(req.body.gender ? { gender: String(req.body.gender) } : {}),
        onboarded: true,
      },
      select: PROFILE_FIELDS,
    });

    return ok(res, user);
  } catch (error) {
    // The availability check above and this write are not one transaction, so
    // two people finishing onboarding on the same handle at the same time both
    // pass it and the unique index decides. Report that as the conflict it is
    // rather than a 500 the user cannot act on.
    if ((error as { code?: string }).code === 'P2002') {
      return usernameConflict('Someone just took that username');
    }
    console.error('[users/me/onboarding]', error);
    return fail(res, 500, 'Failed to save your profile');
  }
});

/**
 * GET /api/users/nearby
 * People with a live broadcast position inside the radius. Only users who are
 * actively sharing appear — there is no lookup of anyone's last known place.
 */
router.get('/nearby', identify, async (req: AuthRequest, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Math.min(Number(req.query.radiusKm) || 5, 25);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return ok(res, []);
    }

    const me = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { college: true },
    });

    const box = boundingBox(lat, lng, radiusKm);

    // Scope to the caller's campus: "nearby" on a public map should not expose
    // arbitrary strangers' live positions.
    const candidates = await prisma.user.findMany({
      where: {
        id: { not: req.user!.userId },
        isActive: true,
        onboarded: true,
        ...(me?.college ? { college: me.college } : {}),
      },
      select: { id: true, name: true, username: true, profilePhoto: true, college: true },
      take: 200,
    });

    const blocked = await prisma.block.findMany({
      where: {
        OR: [{ blockerId: req.user!.userId }, { blockedId: req.user!.userId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(
      blocked.flatMap((b) => [b.blockerId, b.blockedId]).filter((id) => id !== req.user!.userId),
    );

    const nearby = candidates
      .filter((user) => !blockedIds.has(user.id))
      .filter((user) => {
        const position = getLivePosition(user.id);
        if (!position) return false;
        return (
          position.lat >= box.minLat &&
          position.lat <= box.maxLat &&
          position.lng >= box.minLng &&
          position.lng <= box.maxLng &&
          calculateDistanceMetres(lat, lng, position.lat, position.lng) <= radiusKm * 1000
        );
      });

    return ok(res, nearby);
  } catch (error) {
    console.error('[users/nearby]', error);
    return fail(res, 500, 'Failed to load nearby people');
  }
});

/**
 * POST /api/users/me/institute-email
 *
 * Proves ownership of an institute address by verifying a Firebase ID token
 * obtained from signing in with that Google account — the address is asserted
 * by Google, never typed by the user. A free-text field here would be
 * worthless: anyone could enter someone@iitm.ac.in and be "verified".
 *
 * Three things must all hold:
 *   1. the ID token verifies against this Firebase project,
 *   2. Google reports the address as verified (email_verified),
 *   3. its domain is on the institute's list.
 *
 * The client's `hd` parameter is only a chooser hint — Google does not enforce
 * it — so (3) is checked here regardless of what the client asked for.
 */
router.post('/me/institute-email', identify, async (req: AuthRequest, res: Response) => {
  try {
    const idToken = String(req.body.idToken ?? '').trim();
    if (!idToken) {
      return fail(res, 400, 'Sign in with your campus Google account to verify.');
    }
    if (!isFirebaseAdminConfigured()) {
      return fail(res, 503, 'Verification is not configured on this environment.');
    }

    let decoded;
    try {
      decoded = await verifyFirebaseIdToken(idToken);
    } catch {
      return fail(res, 401, 'That sign-in could not be verified. Try again.');
    }

    const email = String(decoded.email ?? '').trim().toLowerCase();
    if (!email) {
      return fail(res, 400, 'That Google account has no email address.');
    }

    // Google Workspace accounts are always verified; a personal account with an
    // unverified address must not count.
    if (decoded.email_verified !== true) {
      return fail(res, 400, 'That Google account’s email is not verified.');
    }

    const me = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { instituteId: true, college: true },
    });

    if (!me?.instituteId) {
      return fail(res, 400, 'Choose your institute first', 'no-institute');
    }

    if (!emailMatchesInstitute(email, me.instituteId)) {
      const expected = institutePrimaryDomain(me.instituteId);
      return fail(
        res,
        400,
        expected
          ? `That address is not from ${me.college}. Use your @${expected} email.`
          : `${me.college} has no verifiable email domain yet.`,
        'domain-mismatch',
      );
    }

    // One institute address per account, so two people cannot claim the same
    // campus identity. Also blocks claiming an address that is already somebody
    // else's sign-in email.
    const taken = await prisma.user.findFirst({
      where: {
        id: { not: req.user!.userId },
        OR: [{ instituteEmail: email }, { email }],
      },
      select: { id: true },
    });
    if (taken) {
      return fail(res, 409, 'That institute email already belongs to another account.');
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { instituteEmail: email, instituteVerified: true },
      select: PROFILE_FIELDS,
    });

    return ok(res, user);
  } catch (error) {
    console.error('[users/me/institute-email]', error);
    return fail(res, 500, 'Could not save your institute email');
  }
});

/** POST /api/users/me/push-token — registers an FCM token, deduplicated. */
router.post('/me/push-token', identify, async (req: AuthRequest, res: Response) => {
  try {
    const token = String(req.body.token ?? '').trim();
    if (!token) return fail(res, 400, 'A token is required');

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fcmTokens: true },
    });

    if (!user?.fcmTokens.includes(token)) {
      await prisma.user.update({
        where: { id: req.user!.userId },
        // Cap the list so a user cycling browsers does not accumulate tokens
        // forever; the newest 10 devices are plenty.
        data: { fcmTokens: [...(user?.fcmTokens ?? []), token].slice(-10) },
      });
    }

    return res.status(204).end();
  } catch (error) {
    console.error('[users/me/push-token]', error);
    return fail(res, 500, 'Failed to register push token');
  }
});

/**
 * Fields visible on someone else's profile. Deliberately narrower than
 * PROFILE_FIELDS — email, phone and institute details belong to the account
 * holder alone.
 */
const PUBLIC_PROFILE_FIELDS = {
  id: true,
  name: true,
  college: true,
  rating: true,
  totalRides: true,
  profilePhoto: true,
  lastSeen: true,
} as const;

/**
 * GET /api/users/:id — another user's public profile.
 *
 * Migrated verbatim from the legacy router (routes/users.ts) with the selected
 * fields and the `{ user }` body preserved exactly, because mobile clients read
 * that shape. It is NOT moved to the `{ success, data }` envelope for the same
 * reason.
 *
 * Two things differ from the legacy version, both deliberate:
 *
 *  1. `identify` replaces `authenticate`. identify is a strict superset — it
 *     tries the backend JWT first by the same code path, then falls back to a
 *     Firebase ID token. Existing JWT callers are unaffected; web callers stop
 *     failing. Under `authenticate` this endpoint returned 401 for every web
 *     request, because the web client sends a Firebase ID token and that
 *     middleware verifies backend JWTs only — /profile/[userId] was broken.
 *  2. Auth-failure bodies therefore follow identify's shape
 *     ({ success, message }) rather than the legacy { error }. Success and
 *     not-found bodies are unchanged.
 *
 * Declared last: `/:id` matches a single segment, so it must not precede
 * /nearby or /username-available.
 */
router.get('/:id', identify, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: PUBLIC_PROFILE_FIELDS,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('[users/:id]', error);
    return res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
