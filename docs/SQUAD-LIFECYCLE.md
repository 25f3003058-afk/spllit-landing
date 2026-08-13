# Squad Lifecycle

Implemented 2026-08-14. The rules live in `backend/src/services/squadLifecycle.ts`
and are tested in `backend/src/__tests__/squad-lifecycle.test.ts`; the status
vocabulary lives in `backend/src/services/squads.ts`. This document is the why.

A squad must not depend on its creator remembering to press *End Squad*. But the
failure mode of an automatic ending is worse than a forgotten squad: closing a
squad while somebody is still walking to the meeting point strands them with no
chat, no navigation and no explanation. Every rule here is written to fail in the
direction of staying open.

## Why the state is computed on read, not on a timer

The obvious implementation — a job that wakes at the expiry time and completes
the squad — is wrong on this platform, and it is worth writing down why so it is
not reintroduced later.

The API runs on Cloud Run (`.github/workflows/deploy-backend.yml`). Two
properties of that make in-process timers unsound:

- **It scales to zero.** A `setInterval` armed for 11:15 never fires if no
  request arrives before then. The squad stays open indefinitely — the exact bug
  the feature exists to prevent.
- **It runs multiple instances.** Every instance owns its own timer, so a
  transition fires once per instance: the squad completes N times and sends N
  notifications.

The two `setInterval` calls already in the backend (`services/directions.ts:94`,
`services/pickup.ts:179`) are per-instance cache sweeps. They are safe precisely
because running them N times and running them never are both harmless. Lifecycle
transitions are neither.

So the lifecycle is **derived, not scheduled**. State is a pure function of
`(squad, members, now)`. Any read evaluates it, and persists the result only when
it differs from what is stored. This is immune to scale-to-zero, correct under
any number of instances, and needs no new infrastructure.

The cost, stated honestly: **a squad nobody reads does not transition on time.**
Its state is still correct the instant anyone looks, but no "squad completed"
notification goes out at 11:15 for a squad sitting unobserved. If timely
notifications are wanted later, add a low-frequency Cloud Scheduler sweep that
calls the *same* evaluation function — the design does not have to change to
accommodate it.

## States

`Squad.status` today is `active | completed | cancelled` (`schema.prisma:543`).
One state is added:

```
              CREATE
                ↓
             ACTIVE ─────────────────┐
                ↓                    │
        meetingAt passes             │ leader ends manually,
                ↓                    │ at any point
          IN_PROGRESS ───────────────┤
                ↓                    │
      ┌─────────┴─────────┐          │
      ↓                   ↓          ↓
 arrival quorum      expiry rules   COMPLETED / CANCELLED
      ↓                   ↓
  COMPLETED         AUTO-COMPLETED
```

`IN_PROGRESS` means *"the scheduled time has passed; people may still be
travelling."* It is not a lesser form of active: joining, chat, navigation and
location sharing all continue exactly as in `ACTIVE`. It exists so that the
expiry clock has something to start from that is distinct from "created".

Transitions are **monotonic**. A squad never moves backwards, and never leaves a
terminal state. This matters because `now` comes from a machine clock: skew or a
corrected clock must not resurrect a completed squad.

## Schema changes

| Field | Change | Why |
|---|---|---|
| `Squad.status` | add `in_progress` | new state above |
| `Squad.meetingAt` | stays nullable | see exemption below |
| `Squad.durationMinutes` | **new**, `Int?` | no estimate of how long the squad lasts exists today |
| `Squad.lastActivityAt` | **new**, `DateTime?` | inactivity cannot be computed from existing columns |
| `Squad.isActive` | reconcile | see below |

**`meetingAt` stays nullable, and squads without one are exempt from the
lifecycle.** Making it required would be a migration over existing rows with no
correct value to backfill. A squad with no meeting time has no clock to run, so
it stays `ACTIVE` until ended manually. This must be stated in the UI rather than
left as a silent difference in behaviour.

**`isActive` must stop being a second liveness flag.** It is a boolean beside
`status`, and `@@index([visibility, isActive])` is what drives discovery queries.
Two sources of truth for "is this squad alive" will drift the moment one write
path updates one and not the other. Before implementation, decide one:

- derive `isActive` from `status` on every write (keeps the index working), or
- drop `isActive`, and reindex discovery on `status`.

The second is cleaner and the migration is small. Either is acceptable; leaving
both independent is not.

## The evaluation function

Pure, synchronous, no database access, so it is unit-testable against fixtures
the way `backend/src/__tests__/units.test.ts` already tests other logic:

```
evaluateLifecycle(squad, members, now) -> { status, reason }
```

Persistence is a separate, thin caller. That separation is the whole reason the
rules below can be tested exhaustively without a database.

### Concurrency

Two instances may evaluate the same squad in the same millisecond and both decide
`COMPLETED`. The write must therefore be a compare-and-set, not a blind update —
an `updateMany` guarded on the *expected current status*:

```
updateMany({ where: { id, status: 'in_progress' }, data: { status: 'completed' } })
```

`count === 1` means this caller won the transition and owns the side effects
(notification, stopping location sharing). `count === 0` means another instance
got there first and this caller must do nothing. Without this guard, lazy
evaluation reintroduces the duplicate-notification bug that the timer approach
was rejected for.

## Rules

### ACTIVE → IN_PROGRESS

`now >= meetingAt`. Nothing else. No side effects beyond the status write.

### IN_PROGRESS → COMPLETED, by arrival quorum

All members in the arrival quorum have `status === 'arrived'`.

The quorum is members whose status is in `ACTIVE_MEMBER_STATUSES`
(`services/squads.ts:91`) — `active | travelling | arrived`. `pending` and `left`
are excluded: a join request nobody approved and a member who walked away must
not hold a squad open.

**The location-denial problem.** A member who denies location permission has
`lat`/`lng` of `null`, so `progressToMeetingPoint` returns `arrived: false`
permanently (`services/squads.ts:178-180`). They can never satisfy the quorum.
This is the common case, not an edge case — most squads will contain at least one
such member, and if they count, the arrival path never fires and every squad
falls through to expiry.

So: **a member who has never reported a position is excluded from the quorum.**
Concretely, quorum membership requires a non-null `locationAt`. A member who
shared location and then stopped is still counted — they were travelling, and
their silence is what the expiry rules are for.

**Floor:** the quorum must hold at least `MIN_ARRIVAL_QUORUM` (2) members before
their arrival may end the squad. A solo squad would otherwise complete the
instant its creator reached the meeting point, which reads as the app cancelling
their plan; and one person arriving says nothing about anyone else when they are
the only one sharing location at all. Those squads end by expiry or by hand.

This is also the answer to "what if nobody has usable location": the quorum is
empty, the floor is not met, and the expiry rules take over.

### IN_PROGRESS → COMPLETED, by expiry

Defined against three timestamps:

```
expectedEndAt = meetingAt + durationMinutes   (default 45 when unset)
softExpiryAt  = expectedEndAt + 90 minutes
hardExpiryAt  = meetingAt + 4 hours
```

Worked example — meet 9:00, 45 minute trip:

```
 9:00  meetingAt        ACTIVE → IN_PROGRESS
 9:45  expectedEndAt    nothing happens; this is only an input
11:15  softExpiryAt     complete *if* quiet for 30 minutes
13:00  hardExpiryAt     complete unconditionally
```

Completion occurs when **either**:

- `now >= softExpiryAt` **and** `now - lastActivityAt >= 30 minutes`, or
- `now >= hardExpiryAt`, unconditionally.

The first rule is what "active navigation extends the squad" means here. There is
no stored extension and no separate extension state: a squad that is still being
used simply keeps failing the quietness test on every read, and so keeps living,
until it goes quiet for 30 minutes or hits the hard ceiling. That is the same
behaviour as "extend by 30 minutes", expressed without state that could itself go
stale.

`hardExpiryAt` is the backstop against exactly that staleness — a phone left in a
pocket reporting position forever must not keep a squad open overnight.

## What counts as activity

Activity is the later of two things: the squad's own `lastActivityAt` column, and
the newest `locationAt` across its members.

`lastActivityAt` is written on a message to the squad thread and on a membership
change. **Position reports deliberately do not write it** — `recordPosition`
already stamps `locationAt` on the member row, so reading that gives "somebody is
still navigating" for free rather than adding a second write to the hottest path
in the squad. It is the same signal either way, and one fewer write per report.

It is **not** bumped by reading the squad, opening the app, a page refresh, or a
socket connecting. This is critical under lazy evaluation: reads are what trigger
evaluation, so if reading counted as activity, any squad someone glances at would
postpone its own expiry indefinitely and the feature would silently do nothing.

**Socket presence is not an activity signal.** Backend deploys replace the running
revision and drop every open Socket.IO connection — this is the stated reason
`deploy-backend.yml` is path-filtered to `backend/**`. A deploy at 9:40 would
otherwise look like every member going inactive at once. The durable
`SquadMember.locationAt` column is the sound signal; connection state is not.

## Arrival plausibility

Arrival is already detected server-side from reported position rather than a
button the member presses (`services/squads.ts:205-211`) — there is no
`POST /arrived` to remove, and self-declared arrival is already not accepted.

What is missing is plausibility. The current test is distance alone:
`distanceMetres <= ARRIVAL_RADIUS_METRES` (20 m, `services/squads.ts:158`). A
fabricated coordinate passes it trivially. Add, in `recordPosition`:

- **Accuracy gate** — reject a fix whose reported accuracy is wider than the
  arrival radius. A 200 m-accurate fix 20 m from the point proves nothing.
- **Speed plausibility** — from the previous position and `locationAt`, derive
  implied speed. Chennai to the meeting point in two seconds is not travel.
- **Dwell** — require the member to remain within the radius across at least two
  reports spanning ~20 seconds, rather than flipping on a single sample.
- **Approach** — a first-ever position report that is already inside the radius
  is weaker evidence than one preceded by a track closing on it. Do not reject
  it; do not let it alone satisfy the quorum.

This does not defeat a determined GPS spoofer and should not be described as if
it does. It defeats casual fake arrivals, which is the realistic threat.

## Completion side effects

On entering a terminal state, and only for the caller that won the compare-and-set:

- location sharing stops; `lat`, `lng` cleared per the existing leave behaviour
- navigation tracking stops
- new joins are refused
- **chat becomes read-only history** — the thread and every message are retained,
  posting is refused. Nothing is deleted.

`CANCELLED` and `COMPLETED` differ in meaning and in what members are told, not
in mechanism. Cancellation already sets every member to `left`, which is why the
progress endpoint answers 403 afterwards.

Manual ending by the leader stays available at every state and is unchanged.

## Client trust boundary

Clients never write `status`. There is no endpoint that accepts a squad status
from a request body, and none should be added. The client's only inputs to the
lifecycle are position reports, messages, and membership actions — all of which
are already authenticated and already validated server-side.

## Test cases

The evaluation function is pure, so all of these are fixtures, not integration
tests:

1. `meetingAt` in the future → stays `ACTIVE`
2. `meetingAt` just passed → `IN_PROGRESS`
3. all quorum members `arrived` → `COMPLETED`
4. all *but one* arrived, that one still `travelling` → stays `IN_PROGRESS`
5. one member never shared location, all others arrived → `COMPLETED` (excluded from quorum)
6. solo squad, leader arrived → stays `IN_PROGRESS` (floor)
7. past `softExpiryAt`, message 5 minutes ago → stays `IN_PROGRESS`
8. past `softExpiryAt`, quiet 31 minutes → `COMPLETED`
9. past `hardExpiryAt`, position reports still arriving → `COMPLETED` (stale session)
10. `meetingAt` null → exempt, stays `ACTIVE` regardless of age
11. already `COMPLETED`, `now` moved backwards → stays `COMPLETED` (monotonic)
12. already `CANCELLED`, arrival quorum satisfied → stays `CANCELLED`
13. `durationMinutes` null → 45-minute default applied
14. two concurrent evaluations → exactly one compare-and-set succeeds

## Decisions taken

1. **`isActive` is derived, never set independently.** `isLiveStatus` is the one
   definition, and the column is written from it so `@@index([visibility,
   isActive])` keeps working.
2. **Joining is allowed while `IN_PROGRESS`**, and refused once terminal. Someone
   running late can still get in. The join route had *no* squad-status check at
   all before this, so a request could be queued against a squad that had
   already ended; that is now a 409 `squad-ended`.
3. **The defaults ship as chosen** — 45 / 90 / 30 minutes and a 4-hour ceiling —
   in `LIFECYCLE`, named, in one module, to be tuned from real usage.
4. **No scheduled sweep.** Lazy evaluation only, with the notification cost
   accepted. Adding a sweep later means calling the same function on a timer.
5. **The stored status stays `'active'`** for the pre-start state, labelled
   "Scheduled" in the UI. Renaming it to `scheduled` would have meant a data
   migration over every existing row plus edits to roughly fifteen queries
   including the discovery filter — risk with no behavioural gain.

## What this touched beyond the new module

Adding a live status that is not `'active'` means every query asking whether a
*squad* is live had to stop comparing to that string. Missing one would not fail
loudly; it would quietly make squads vanish at the moment they started. The sites
were: discovery (`OPEN_SQUAD_WHERE`), socket room authorisation (`live.ts`),
join-code allocation and lookup, `currentCommitment`, `/squads/mine`, the
one-squad-at-a-time limit, and the leader's own End Squad guard.

Two are worth calling out because they would have been silent and severe:

- **`squadPostDenial` gated posting on `status !== 'active'`.** Left alone, chat
  would have gone read-only in every squad the instant its meeting time passed —
  precisely when "I'm five minutes away" needs sending. It now tests for
  terminal states.
- **`live.ts` room authorisation** filtered rooms on `squad.status === 'active'`,
  so members would have been evicted from their own squad's socket room at the
  meeting time.

On the client, `isSquadLive` in `lib/squad-purpose.ts` mirrors the same rule;
comparing to `'active'` there would have stopped location sharing and hidden the
leader's End Squad button on a squad that had merely started.
