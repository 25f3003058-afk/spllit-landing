# Assistant artwork

Lottie animations for the Spllit AI assistant on `/squads/new`.

Drop `.json` files here, then register them in
[`components/shared/ai-orb-art.ts`](../../../components/shared/ai-orb-art.ts).
That file is the only thing you edit — no component changes, no imports, no
build step.

```ts
export const ORB_ART: Partial<Record<OrbPhase, OrbArt>> = {
  thinking: { src: '/lottie/ai/thinking.json', loop: true },
  success:  { src: '/lottie/ai/success.json',  loop: false },
};
```

Until a phase is registered, the orb draws itself as inline SVG. That is a
working state, not a placeholder to be raced: animations can land one at a time,
in any order, and the assistant is complete without any of them.

## The five phases

| Phase | When it shows | Loops | Notes |
|---|---|---|---|
| `idle` | Resting in the label above the box | yes | Seen on every visit. Must not draw the eye. |
| `thinking` | Request in flight — **10 to 35 seconds** | yes | The one people actually watch. Must read as working, not stuck. |
| `scanning` | Filling the form field by field | yes | Suggests attention moving across something. |
| `success` | Everything landed | **no** | One gesture, then still. |
| `failed` | Nothing understood, or the call failed | **no** | Apologetic, not alarming — nothing broke for the user. |

Getting `loop` wrong is the usual mistake. A waiting animation that stops while
the work continues reads as a hang; a celebration that repeats forever stops
being a celebration.

## Constraints

- **Square artboard.** Rendered into equal width and height — 20 px in the
  label, 40 px in the panel. Fine detail disappears at that size; test at 20 px
  before deciding it works.
- **Keep them small.** The existing loaders here are 126–192 kB each, which is
  why they are fetched rather than imported. These load on a form people use
  often, so smaller matters more than it does there.
- **Warm orange to red** is the assistant's colour, deliberately distinct from
  the brand buttons around it.
- **Transparent background.** The panel supplies its own surface, in both light
  and dark themes.

## What you do not need to handle

- **Reduced motion.** Honoured before this point — a user with
  `prefers-reduced-motion` never mounts the player at all and sees the static
  orb, so the animation does not need a still variant.
- **Loading and failure.** The SVG renders while the JSON downloads and keeps
  rendering if it never arrives.
- **Server rendering.** lottie-web needs a real canvas and is code-split behind
  `next/dynamic` with `ssr: false`.
