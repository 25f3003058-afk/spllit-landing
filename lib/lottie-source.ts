/**
 * Fetching a Lottie animation, once.
 *
 * Lifted out of `lottie-loader.tsx`, which owned the only copy, when the AI
 * assistant needed the same thing. Two caches would not have been obviously
 * wrong — they hold different URLs — but they would have been two places to fix
 * the next time something about this is subtle, and everything about it already
 * is.
 *
 * **Fetched rather than imported.** These files are 126–192 kB of JSON each.
 * Imported, they would be inlined into a route chunk that every visitor
 * downloads, and TypeScript would try to infer a literal type for each one,
 * which is slow enough to notice on `tsc`. As static files under `public/` they
 * are cached by the CDN, shared between routes, and only fetched by someone who
 * actually reaches the thing that shows them.
 *
 * **The promise is cached, not the resolved value.** Two components mounting in
 * the same tick share one request, and — the part that matters — the resolved
 * object keeps a stable identity. That identity is what stops lottie-web from
 * tearing down and rebuilding the animation every time the parent re-renders.
 */

const cache = new Map<string, Promise<unknown>>();

export function loadAnimation(src: string): Promise<unknown> {
  let pending = cache.get(src);
  if (!pending) {
    pending = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Lottie ${src} returned ${res.status}`);
        return res.json() as Promise<unknown>;
      })
      .catch((err: unknown) => {
        // Don't poison the cache — a component mounted after a transient
        // failure should get to try again rather than inherit the rejection
        // forever.
        cache.delete(src);
        throw err;
      });
    cache.set(src, pending);
  }
  return pending;
}
