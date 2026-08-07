# API Lifecycle & Deprecation Policy

Binding for the Spllit backend and web app. Adopted 2026-08-07.

Spllit's backend serves a Flutter app, the website, an admin panel, Cloud
Functions and future AI integrations. It is a **platform**, not one app's
backend. An endpoint therefore outlives whichever client stopped calling it, and
"the current frontend doesn't use it" is never a reason to delete anything.

## API Lifecycle

Every endpoint moves through these stages, in order, without skipping:

```
NEW
 ↓
ACTIVE
 ↓
DEPRECATED
 ↓
INSTRUMENTED
 ↓
NO TRAFFIC VERIFIED
 ↓
REMOVED
```

Never:

```
OLD  →  NEW  →  keep both forever
```

Two live implementations of the same behaviour is a defect, not a migration
state. The only acceptable steady states are "old" and "new" — never both.

### NEW
Specified in the SRS before it is written. An endpoint with no specification
does not get built; if an existing one has no specification, stop and ask rather
than inferring intent from its implementation.

### ACTIVE
In the contract. Breaking changes require a new endpoint, not an edit.

### DEPRECATED
Still fully functional. Gains a `@deprecated` JSDoc tag naming its replacement
and a row in the register below. Nothing is removed at this stage.

### INSTRUMENTED
Wrapped in usage logging that records every call. See
`backend/src/middleware/deprecation.ts`, mounted per-router with
`router.use(deprecated('<name>'))`.

Instrumentation is mounted *inside* the deprecated router, not on its path in
`server.ts`, because `/api/users` and `/api/rides` each host a platform router
and a legacy one on the same prefix. A path-level hook would attribute live
platform traffic to the legacy router.

### NO TRAFFIC VERIFIED
Zero recorded calls across a full observation window, plus a second corroborating
signal. The window must cover the slowest real usage cycle — for anything a
mobile client could reach, at least one full release cycle of that client, and
only after both web and Flutter have moved to the replacement.

**Static analysis cannot discharge this stage.** See "Audit boundary".

Acceptable corroborating signals:

- production access logs show no hits across the window,
- the consumer's own source is audited directly (not inferred),
- the consumer's owner confirms in writing.

### REMOVED
Deleted in one commit that takes all of: the implementation, its mount, its
tests, its documentation entries, and any config, env var or CORS special-case
that existed only to serve it. A deletion that leaves the mount or the docs
behind has not happened.

## API classification

Every endpoint carries exactly one classification:

| Class | Meaning | Deletion bar |
|---|---|---|
| **Public** | Consumed by shipped clients (web, Flutter) | Full lifecycle. Slowest client's release cycle |
| **Stable** | Public and contractually frozen | Full lifecycle plus an announced window |
| **Internal** | Cloud Functions / admin / server-to-server only | Full lifecycle, shorter window |
| **Deprecated** | Instrumented, awaiting removal | Governed by the stages above |

## Audit boundary

This repository contains the Next.js web app and the Express/Prisma backend. It
does **not** contain:

- the Flutter application
- any native mobile client
- any separately deployed admin panel
- external integrations or webhook senders

A repo-wide search therefore proves nothing about those consumers. The backend's
own CORS layer makes the gap explicit:

```ts
// backend/src/server.ts
function isAllowedOrigin(origin?: string): boolean {
  // No Origin header: same-origin, curl, or a native app.
  if (!origin) return true;
  ...
}
```

Requests with no `Origin` header — what a native app sends — are allowed by
design. The API was deliberately built to serve clients that are not in this
repository. Any deletion argued purely from "no references found here" is
unsound.

The same assumption is recorded in `backend/src/utils/respond.ts`, which keeps
legacy response shapes untouched "so mobile clients are not broken".

## Deprecation register

All rows are INSTRUMENTED as of 2026-08-07 and awaiting runtime evidence.

| Surface | Replacement | Stage | Review |
|---|---|---|---|
| `routes/auth.ts` | Firebase SDK + `/users/me/bootstrap` | INSTRUMENTED | — |
| `routes/users.ts` | `routes/usersPlatform.ts` | INSTRUMENTED | — |
| `routes/rides.ts` | `routes/ridesPlatform.ts` | INSTRUMENTED | — |
| `routes/admin.ts` | `routes/adminPlatform.ts` | INSTRUMENTED | — |
| `routes/matches.ts` | superseded by rides + chat | INSTRUMENTED | — |
| `routes/emergency.ts` | — | INSTRUMENTED | — |
| `routes/announcements.ts` | — | INSTRUMENTED | — |
| `routes/subadmin.ts` | — | INSTRUMENTED | — |
| `routes/earlyAccess.ts` | — | INSTRUMENTED | — |
| `routes/automation.ts` | — | INSTRUMENTED | — |
| Prisma `User` model | Firestore `users` collection | DEPRECATED | Awaiting SRS |

Completed:

| Surface | Replacement | Completed |
|---|---|---|
| `GET /api/users/:id` (legacy router) | `usersPlatform.ts` | 2026-08-07 |

## Operating the instrumentation

Enabled by default. Disable with `DEPRECATION_LOG=false`.

Each call emits one `[DEPRECATED]` line carrying route, method, timestamp, user
id when authenticated, User-Agent, Origin, whether Origin was absent, and the
response status. `getDeprecationReport()` returns an in-memory tally for a quick
read.

The in-memory registry resets on restart and does not survive a deploy. Platform
logs are the durable record — **an empty registry after a restart is not
evidence of no traffic.**

## Applying this to the Firestore migration

The Prisma `User` model is itself a deprecation. The migration must not end in a
dual-write steady state — that is exactly the "keep both forever" failure this
policy exists to prevent. Firestore becomes authoritative, Prisma `User` is
removed, and every service references the Firebase Auth UID.
