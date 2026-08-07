# Deploying Spllit

**Backend** → Cloudflare Containers (a Worker in front of a container running
the Express + Socket.IO server).
**Frontend** → Vercel.

Render is no longer used.

```
Browser
  ├── https://spllit.app            → Vercel (Next.js)
  └── https://api.spllit.app        → Cloudflare Worker
                                        └── Container (Express + Socket.IO)
                                              └── MongoDB Atlas
```

Why a container and not a plain Worker: Workers cannot open raw TCP (so no
Prisma/MongoDB), cannot run `firebase-admin` or `bcrypt` (Node crypto and native
bindings), and cannot host Socket.IO. A container runs the existing server
unchanged.

---

## 1. Backend — Cloudflare

### One-time setup

**Docker Desktop must be installed and running.** `wrangler` builds the
container image locally before pushing it, so deploys fail without it — even
with `--dry-run`. (A Docker-compatible CLI such as Podman works too; point
`WRANGLER_DOCKER_BIN` and `DOCKER_HOST` at it.)

```bash
cd backend
npm install
npx wrangler login
```

Set the custom domain in `wrangler.jsonc` (`routes`) to whatever you own; the
zone must already be in your Cloudflare account.

### Secrets

**Never put these in `wrangler.jsonc`** — it is committed. Use `wrangler secret
put`, which stores them encrypted and injects them into the container as normal
environment variables (`process.env.DATABASE_URL` works exactly as it does
locally).

```bash
cd backend

wrangler secret put DATABASE_URL            # mongodb+srv://…
wrangler secret put JWT_SECRET              # openssl rand -base64 48
wrangler secret put JWT_REFRESH_SECRET      # a DIFFERENT value
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY    # see the note below
wrangler secret put MAPBOX_SECRET_TOKEN     # sk.… with directions:read

# Optional — only if you keep the AI mail-automation routes.
wrangler secret put OPENAI_API_KEY
```

Verify with `npm run cf:secrets`.

> **`FIREBASE_PRIVATE_KEY` is the one that bites.** Paste the whole key
> including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
> lines. `utils/firebaseAdmin.ts` un-escapes `\n`, so the single-line escaped
> form from the service-account JSON works. A truncated key fails silently as
> "Invalid token" on every authenticated request, which looks like a login bug
> rather than a config one.

Non-secret values (`NODE_ENV`, `FRONTEND_URL`, JWT lifetimes) live in the
`vars` block of `wrangler.jsonc`. Change `FRONTEND_URL` to your real frontend
origin — it drives the CORS allowlist.

### Deploy

```bash
cd backend
npm run cf:typecheck   # typechecks the Worker entry against the CF runtime
npm run cf:deploy      # builds the Docker image, pushes it, deploys the Worker
```

First deploy takes a few minutes (image build + push). Then:

```bash
curl https://api.spllit.app/health     # expect 200
npm run cf:tail                        # live logs
```

### Initialise the database, once

```bash
cd backend
DATABASE_URL="<your production URI>" npx prisma db push
```

This creates indexes for the new collections (Squad, Event, Community,
ChatThread, Notification, Waitlist…). MongoDB creates the collections
themselves lazily on first write, so this is about indexes, not existence.

### Scaling caveat — read before raising `max_instances`

`max_instances` is **1** on purpose. Socket.IO keeps connection and room state
in process memory. With more than one container, a client's handshake and its
websocket can land on different instances, and rooms only contain whoever
happens to share a process — presence, live positions and chat all break in
ways that look intermittent.

To scale out you must first add a Socket.IO Redis adapter, then change
`getContainer(env.BACKEND, 'spllit-api-singleton')` in `edge/worker.ts` to a
distribution key.

---

## 2. Frontend — Vercel

Import the repo, framework **Next.js**, root directory **`.`** (the repo root —
not `backend/`).

> **The frontend does not deploy to Cloudflare.** Only the backend does.
>
> Pointing a Cloudflare Workers/Pages project at this repo root fails: it
> detects Next.js, runs `npx wrangler deploy`, and that triggers an
> `@opennextjs/cloudflare` migration which errors with
> `Cannot find package 'wrangler'`. Nothing here is set up for OpenNext, and
> adding it would mean maintaining two builds of the same app.
>
> If a Cloudflare project is already attached to this repo, either delete it or
> point it at `backend/` with the deploy command `npm run cf:deploy` — that is
> the container described in section 1.

### `vercel.json`

Vercel validates this file against a strict schema and rejects unknown
properties outright, with a message like:

```
headers[0].headers[4] should NOT have additional property `comment`
```

So the header entries carry **only** `key` and `value`. There is no comment
syntax in JSON, and annotating an entry with a `comment` property fails the
build rather than being ignored. Two header choices worth recording here
instead:

- **`Cross-Origin-Opener-Policy: same-origin-allow-popups`** — not
  `same-origin`. Firebase Google Sign-In opens a popup and talks back to the
  opener; the stricter value severs that and sign-in hangs with no error.
- **`Permissions-Policy: geolocation=(self)`** — the map, live location and
  meeting-point ETAs all need it, so it cannot be denied outright.

### Environment variables

Settings → Environment Variables. Set them **before** the first build:
`NEXT_PUBLIC_*` values are compiled into the browser bundle, so changing one
requires a redeploy, not a restart.

| Key | Value |
|---|---|
| `NEXT_PUBLIC_ENV` | `production` |
| `NEXT_PUBLIC_API_URL` | `https://api.spllit.app/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://api.spllit.app` *(no `/api`)* |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → Your apps → **Web** |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ” |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ” |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ” |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ” |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ” |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox **public** token, `pk.…` |

Optional: `NEXT_PUBLIC_DEFAULT_LNG`, `_LAT`, `_ZOOM`, `_PLACE`.

> **None of the `NEXT_PUBLIC_*` values are secret.** They ship in the JavaScript
> bundle and anyone can read them in devtools. That is expected for these keys —
> which is exactly why they must be restricted at the provider rather than
> hidden: Firebase → Authentication → Settings → **Authorized domains**, and
> Mapbox → token → **URL restrictions**.
>
> The two Mapbox tokens are not interchangeable. The browser gets `pk.…`; the
> container gets `sk.…` for Directions/ETA, so route computation never burns the
> public token's quota and the secret one never reaches a browser.

---

## 3. Post-deploy checklist

1. `curl https://api.spllit.app/health` → 200.
2. Firebase Console → Authentication → Settings → Authorized domains → add your
   Vercel domain, or Google Sign-In is rejected.
3. Sign in on the deployed site; confirm no CORS errors in the console. If there
   are, `FRONTEND_URL` in `wrangler.jsonc` does not match your origin.
4. Promote yourself to admin — there is no bootstrap path by design:
   ```js
   db.User.updateOne({ email: "you@example.com" }, { $set: { role: "admin", isAdmin: true } })
   ```
5. Open `/admin` and confirm the dashboard loads.

## 4. Rollback

The pre-rebuild Vite application is preserved at the `pre-rebuild-v1` tag and
the `preserve/production-v1` branch.
