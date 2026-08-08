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

### Which backend section do I want?

All four build the same `backend/Dockerfile`, so switching hosts is a redeploy
rather than a rewrite. Pick one; ignore the rest.

| | Needs local Docker | Cost | Region | |
|---|---|---|---|---|
| **§1d Cloud Run** | no — Cloud Build | free tier, then usage | Mumbai | **Start here.** Same Google project as Firebase Auth, so one console and one bill. |
| §1c Azure | no — builds in Azure | low single digits/mo | Central India | If you have Azure for Students credit. |
| §1b DigitalOcean | no — builds on push | $5/mo flat | Bangalore | Simplest pricing to reason about. |
| §1 Cloudflare | **yes** | $5/mo *(Workers Paid)* | global edge | Only if you already pay for Workers. |

The **local Docker** column is the one that decides it in practice: §1 builds
the image on your machine and cannot run without Docker Desktop, while the
other three build in the provider's cloud.

Every one of them pins the instance count to **1**. Socket.IO keeps rooms,
presence and live positions in process memory, so a second instance does not
share them and users silently stop seeing each other — under exactly the load
that triggers the scale-out. A Socket.IO Redis adapter has to come first.

---

## 1. Backend — Cloudflare

### One-time setup

**Cloudflare Containers require the Workers Paid plan.** On the free plan the
deploy builds the image successfully and then fails at the push with a bare
`X [ERROR] Unauthorized`, which reads like a credentials problem — it is not.
`wrangler containers list` prints the real reason. Token scopes are a red
herring: `containers (write)` and `cloudchamber (write)` are both present on a
normal `wrangler login` token.

There is no free-plan workaround. Plain Workers cannot host this backend at all
— see the note in §1 of `docs/MIGRATION-REPORT.md` and the dependency list
below — so the choice is the paid plan or a Node host (§1b).

| Dependency | Why a Worker cannot run it |
|---|---|
| `socket.io` | Needs a Node HTTP server |
| `@prisma/client` + MongoDB | Needs raw TCP |
| `bcrypt` | Native binding |
| `firebase-admin` | Node crypto |
| `multer` | Writes to disk |
| `nodemailer` | Raw SMTP |

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

# Optional — the ₹2 squad join fee. Without these the payment endpoints
# answer 503 and everything else still works.
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET

# Optional — only if you keep the AI mail-automation routes.
wrangler secret put OPENAI_API_KEY
```

Or upload the lot in one go from `backend/.env`:

```bash
npm run cf:secrets:push
```

That sends them through a single `wrangler secret bulk` over stdin, so the
values never touch disk and there are no eleven separate prompts to paste the
wrong value into. It refuses to run if a required secret is missing or empty.

Verify with `npm run cf:secrets`.

> A secret only reaches the container if it is also listed in `envVars` on the
> `SpllitBackend` class in `edge/worker.ts`. Anything missing from that list is
> simply absent inside the container, however correctly `wrangler secret put`
> reported success — which looks exactly like a broken feature rather than a
> missing variable. Add new secrets in both places.

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

## 1b. Backend — DigitalOcean App Platform (alternative to §1)

Same `backend/Dockerfile`, so the two hosts are interchangeable and
`backend/wrangler.jsonc` is deliberately kept — switching back is a redeploy,
not a rewrite. Spec: [`.do/app.yaml`](.do/app.yaml).

Also **$5/mo** (`apps-s-1vcpu-0.5gb`); App Platform's free tier covers static
sites only, not web services. What it buys over Cloudflare at the same price is
a **Bangalore region** — every authenticated request and every Socket.IO frame
makes that round trip, and the users are on Indian campuses.

```bash
doctl apps create --spec .do/app.yaml            # first deploy, prints APP_ID
doctl apps update <APP_ID> --spec .do/app.yaml   # after editing the spec
```

No `doctl`? Dashboard → Apps → Create → paste the spec into *Edit App Spec*.

### Secrets

`.do/app.yaml` holds non-secret config only — it is committed. Set these once
in **Settings → App-Level Environment Variables**, each with **type: SECRET**
(DO stores them encrypted and hides them after saving):

```
DATABASE_URL  JWT_SECRET  JWT_REFRESH_SECRET  FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL  FIREBASE_PRIVATE_KEY  MAPBOX_SECRET_TOKEN
RAZORPAY_KEY_ID  RAZORPAY_KEY_SECRET  OPENAI_API_KEY
```

The last four are optional — without them payments and the mail-automation
routes answer 503 and the rest of the API still works. The same
`FIREBASE_PRIVATE_KEY` warning from §1 applies.

### After it deploys

The app gets a `*.ondigitalocean.app` hostname. Point the frontend at it
(§2 *Environment variables*) and **rebuild** — `NEXT_PUBLIC_*` is inlined at
build time:

```
NEXT_PUBLIC_API_URL=https://<app>.ondigitalocean.app/api
NEXT_PUBLIC_SOCKET_URL=https://<app>.ondigitalocean.app
```

`FRONTEND_URL` in the spec drives CORS and is already `https://spllit.app`;
`spllit.app` and `www.spllit.app` are hardcoded in the allowlist regardless.

For `api.spllit.app` instead: Settings → Domains → add it, then create the CNAME
DigitalOcean gives you. Make sure no record for that name still points at a
previous host — a stale one serves an expired certificate, which browsers refuse
before any request is made.

> `instance_count` stays at **1**, for the reason `max_instances` is pinned to 1
> in `wrangler.jsonc`: Socket.IO keeps rooms, presence and live positions in
> process memory. A second instance does not share them, so users land on
> different instances and silently stop seeing each other. A Redis adapter comes
> first.

---

## 1c. Backend — Azure Container Apps (alternative to §1)

**The one option that needs no Docker locally.** `az containerapp up --source .`
provisions a Container Registry and builds the image *in Azure*, so the machine
running the deploy never needs a daemon — which is the difference between this
and §1, where `wrangler deploy` builds locally and simply cannot run without
Docker Desktop.

Same `backend/Dockerfile` as every other target; its `EXPOSE 8080` is what
ingress binds to.

```bash
winget install -e --id Microsoft.AzureCLI   # then open a NEW terminal
az login

cd backend
npm run azure:deploy
```

`scripts/azure-deploy.mjs` installs the `containerapp` extension, registers the
required providers, creates the resource group, builds and deploys, uploads
every secret from `backend/.env`, pins the replica count, and prints the
hostname. Re-running it redeploys.

Override the defaults (`spllit` / `centralindia` / `spllit-env` / `spllit-api`)
with `AZ_RESOURCE_GROUP`, `AZ_LOCATION`, `AZ_ENVIRONMENT`, `AZ_APP_NAME`.

### Cost

Container Apps includes a monthly free grant per subscription — **180,000
vCPU-seconds, 360,000 GiB-seconds and 2 million requests**. That does not
cover an always-on replica: 0.25 vCPU running for a 30-day month is ~648,000
vCPU-seconds. Time spent idle bills at a reduced rate, so expect a low
single-digit monthly bill rather than the ~$5 of §1/§1b — check the
[pricing calculator](https://azure.microsoft.com/pricing/calculator/) for your
region rather than trusting this paragraph. **Azure for Students** grants $100
of credit without a card, which covers this comfortably.

Scaling to zero would be free while idle, and is *not* used: it drops every
open websocket on the way down, so chat and live location die whenever the
campus goes quiet.

> `--min-replicas 1 --max-replicas 1`, both pinned, for the reason
> `max_instances` is 1 in `wrangler.jsonc` and `instance_count` is 1 in
> `.do/app.yaml`. Socket.IO holds rooms, presence and live positions in process
> memory, and Container Apps would otherwise scale out to 10 under load —
> replicas do not share that state, so two users in one squad land on different
> replicas and silently stop seeing each other. It breaks under exactly the
> traffic that triggers it. A Redis adapter comes first.

### After it deploys

The script prints the `*.azurecontainerapps.io` hostname and the two frontend
variables to set. They are **build-time** values (§2), so the frontend needs a
rebuild, not a restart.

For `api.spllit.app` instead: `az containerapp hostname add` plus the CNAME and
TXT records Azure asks for. Check no record for that name still points at a
previous host — a stale one serves an expired certificate, which browsers
refuse before any request is made.

Logs: `npm run azure:logs`.

---

## 1d. Backend — Cloud Run, in the Firebase project (recommended)

**Cloud Run, not Cloud Functions.** Functions are request-scoped: the instance
serving one request is not necessarily the one that served the last, and
Socket.IO keeps rooms, presence and live positions in process memory. Chat
works in testing and falls apart with two real users. Cloud Run runs the
container as a long-lived server, which is what this app already is.

A Firebase project **is** a Google Cloud project, so `spllit-app-94194` needs
no new account, console or bill. `gcloud run deploy --source .` builds through
Cloud Build, so no local Docker.

```bash
winget install -e --id Google.CloudSDK    # then open a NEW terminal
gcloud auth login

cd backend
npm run gcloud:deploy
```

`scripts/gcloud-deploy.mjs` enables the required APIs, pushes every secret from
`backend/.env` into Secret Manager, grants the Cloud Run runtime account access
to them, builds, deploys, and prints the URL. Re-running redeploys — and
re-uploads secrets, so rotating a value in `.env` actually rolls out.

Defaults to the `FIREBASE_PROJECT_ID` already in `.env` and region
`asia-south1` (Mumbai). Override with `GCP_PROJECT`, `GCP_REGION`,
`GCP_SERVICE`.

### Choices worth knowing about

- **Secret Manager, not `--set-env-vars`.** `FIREBASE_PRIVATE_KEY` is a
  multi-line PEM and every shell mangles multi-line arguments differently;
  piping through stdin sidesteps quoting entirely. A corrupted key fails as
  "Invalid token" on every authenticated request — a login bug, apparently.
- **`--allow-unauthenticated`.** Requests are authenticated by the Firebase
  token in middleware, not by IAM. Without this Cloud Run rejects them before
  Express sees them.
- **`--no-cpu-throttling`.** Cloud Run otherwise throttles CPU between
  requests, which stalls the directions-cache sweep in `services/directions.ts`
  and Socket.IO's heartbeats — surfacing as connections that randomly die.
- **`--timeout 3600`.** WebSockets are HTTP requests on Cloud Run, and 60
  minutes is the ceiling. `lib/live/socket.ts` sets `reconnection: true`, so
  the hourly drop costs a sub-second reconnect, not a dead session.
- **`--min-instances 1`.** Scaling to zero is free while idle and drops every
  open socket on the way down.

### Cost

Cloud Run has an always-free monthly tier, but `--min-instances 1` keeps a
container running continuously, which is what takes you past it. Check the
[pricing page](https://cloud.google.com/run/pricing) for current figures rather
than trusting a number written here. If the bill matters more than sockets
staying up, drop to `--min-instances 0` and accept the reconnects.

### After it deploys

The script prints a `*.run.app` URL and the two frontend variables. They are
**build-time** (§2), so the frontend needs a rebuild.

For `api.spllit.app`: Cloud Run → Manage custom domains, or put a load balancer
in front. Check no record for that name still points at a previous host — a
stale one serves an expired certificate, which browsers refuse outright.

Logs: `npm run gcloud:logs`.

---

## 2. Frontend — Vercel or Cloudflare

The frontend can run on **either** Vercel or Cloudflare Workers. Pick one —
running both means two deploys of the same app and two places for a stale
build to hide.

### Option A — Vercel

Import the repo, framework **Next.js**, root directory **`.`** (the repo root —
not `backend/`). Build command `npm run build`; no deploy command needed.

### Option B — Cloudflare Workers (OpenNext)

Committed and working: `open-next.config.ts`, `wrangler.jsonc`, and `wrangler`
plus `@opennextjs/cloudflare` as devDependencies.

**Set the deploy command to `npm run deploy`.** A bare `npx wrangler deploy`
fails, and the reason is worth knowing:

- `next build` does not produce a Worker. OpenNext has to compile the Next
  server into `.open-next/worker.js` first, which is what `npm run deploy`
  does before deploying.
- With no Cloudflare config present, wrangler detects Next.js and tries to
  migrate the project itself — pulling `@opennextjs/cloudflare` through `npx`,
  where its `import … from 'wrangler'` cannot resolve. That is the
  `Cannot find package 'wrangler'` failure. Committing the config means the
  deploy never takes that path.

| Cloudflare setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Root directory | `.` (repo root) |

`NEXT_PUBLIC_*` values are compiled into the browser bundle, so they belong in
Cloudflare's **build-time** variables. Setting them as Worker runtime vars has
no effect — the bundle was already built.

`nodejs_compat` is set in `wrangler.jsonc` and is not optional: the Next server
uses Node built-ins a Worker does not otherwise expose.

> The `backend/` container is a **separate** Cloudflare project (section 1). Do
> not point a Workers project at the repo root expecting the API.

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

1. **Firebase Console → Authentication → Settings → Authorized domains → add
   every origin the site is served from** — `spllit.app` *and* `www.spllit.app`,
   plus any preview domain you actually sign in on.

   Do this first, because it is the failure that looks least like a config
   problem. Firebase refuses authentication from an origin that is not on the
   list, and it refuses it **in the browser, before any request reaches the
   API** — so Google Sign-In *and* Phone OTP both fail together, on every
   device, while `localhost` (always authorized) keeps working perfectly. It
   reads as "the site is broken", not "a domain is missing".

   Check the live list without opening the console — the key is public:

   ```bash
   curl -s "https://identitytoolkit.googleapis.com/v1/projects?key=<NEXT_PUBLIC_FIREBASE_API_KEY>"
   ```

   If `authorizedDomains` contains only `localhost` and the two
   `*.firebaseapp.com` / `*.web.app` defaults, sign-in cannot work in
   production.

2. `curl https://api.spllit.app/health` → 200. A connection or certificate
   error here (rather than an HTTP status) usually means the API hostname still
   points at whatever hosted the previous stack — check DNS before debugging the
   Worker.
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
