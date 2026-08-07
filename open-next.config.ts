import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext adapter config — how the Next.js server is compiled into a Worker.
 *
 * Required by `opennextjs-cloudflare build`; without it the build stops before
 * it starts. Cloudflare's auto-detection tries to generate this at deploy time
 * and fails, because it runs the migration through `npx` where the `wrangler`
 * import cannot resolve. Committing it means the deploy never takes that path.
 *
 * Deliberately minimal. Incremental cache, tag cache and queue are all left at
 * their defaults (in-Worker, no external store):
 *
 *  - This app has no ISR. Every route is either fully static, prerendered at
 *    build time, or server-rendered per request from the API, so there is no
 *    revalidating cache to persist.
 *  - Wiring an R2 or KV cache would add a binding and a bill for a cache that
 *    would never be read. Add `r2IncrementalCache` here if ISR is ever used.
 */
export default defineCloudflareConfig();
