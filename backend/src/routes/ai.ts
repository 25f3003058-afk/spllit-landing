import { Router, Response } from 'express';
import { z } from 'zod';

import { identify } from '../middleware/identity.js';
import { AuthRequest } from '../types/express.js';
import { ok, fail, parseCoords } from '../utils/respond.js';
import { parseBody, text } from '../utils/validate.js';
import { extractSquadDraft } from '../services/squadIntent.js';
import { isSarvamConfigured } from '../services/sarvam.js';

/**
 * Language-model features, all of them read-only.
 *
 * Nothing on this router writes. That is the boundary the whole AI phase is
 * built around: a model may read a sentence and propose a filled-in form, and a
 * person presses the button that creates the squad. Squad creation stays on
 * `POST /api/squads`, behind the same validation it has always had, reached the
 * same way whether the form was filled by hand or by this.
 *
 * The practical value of that split is that a wrong extraction costs one edit,
 * and can never cost a real squad heading to the wrong place with people in it.
 */

const router = Router();

const squadDraftSchema = z.object({
  text: text(2, 500),
  /**
   * Minutes to add to UTC for the caller's local time.
   *
   * Sent by the client rather than inferred here. The server sees a request
   * from a proxy, and geolocating an IP to a timezone would put a user on a
   * VPN in the wrong day — which for this feature means "tomorrow 9am"
   * resolving to a date they did not mean.
   */
  utcOffsetMinutes: z.coerce.number().int().min(-720).max(840).default(0),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

/**
 * POST /api/ai/squad-draft
 *
 * A sentence in, a proposed draft out. Creates nothing.
 *
 * Answers 200 with `understood: false` when the model is unconfigured,
 * rate-limited, slow or simply unhelpful — never an error status. The client's
 * response to all of those is identical and unremarkable: open the create form
 * the way it opens today. Making it a 5xx would put an error toast in front of
 * a user whose form is about to work fine.
 */
router.post('/squad-draft', identify, async (req: AuthRequest, res: Response) => {
  try {
    const body = parseBody(squadDraftSchema, req.body, res);
    if (!body) return;

    const draft = await extractSquadDraft({
      text: body.text,
      near: parseCoords(body),
      utcOffsetMinutes: body.utcOffsetMinutes,
    });

    return ok(res, draft);
  } catch (error) {
    // Logged without the body: the body is the user's sentence.
    console.error('[ai/squad-draft]', error instanceof Error ? error.name : 'unknown');
    return fail(res, 500, 'Could not read that. Fill the form instead.');
  }
});

/**
 * GET /api/ai/status
 *
 * Whether the assistive entry points are worth showing at all.
 *
 * The client asks once and hides the "describe your trip" box when the answer
 * is no, so an environment without a key shows a create form with no dead
 * affordance on it — rather than a promising input that silently does nothing.
 */
router.get('/status', identify, (_req: AuthRequest, res: Response) => {
  return ok(res, { squadDraft: isSarvamConfigured() });
});

export default router;
