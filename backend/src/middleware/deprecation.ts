import { NextFunction, Response } from 'express';

import { AuthRequest } from '../types/express.js';

/**
 * Usage instrumentation for deprecated routers.
 *
 * The NO TRAFFIC VERIFIED stage in docs/DEPRECATION-POLICY.md cannot be
 * discharged by searching this repository: the Flutter app, any native client
 * and any external admin panel live elsewhere, and the API is deliberately open
 * to them (see isAllowedOrigin in server.ts, which admits requests with no
 * Origin header). Runtime evidence is the only sound basis for deleting these
 * routes, so this records who is actually calling them.
 *
 * Strictly observational. It attaches one `finish` listener and never touches
 * the response, so behaviour is identical whether it is enabled or not.
 */

/** Disable with DEPRECATION_LOG=false. On by default — collecting nothing by
 *  accident is the failure mode that matters here. */
function isEnabled(): boolean {
  return process.env.DEPRECATION_LOG !== 'false';
}

export type ClientType = 'web' | 'native-or-server' | 'unknown';

export interface DeprecationHit {
  /** Router the request landed in, e.g. "auth". */
  router: string;
  /** Matched route pattern, e.g. "/login" — not the raw URL, so ids collapse. */
  route: string;
  method: string;
  count: number;
  lastAccess: string;
  lastStatus: number;
  clientTypes: Record<ClientType, number>;
  /** Distinct authenticated users seen, capped to bound memory. */
  userIds: string[];
  userAgents: string[];
}

const registry = new Map<string, DeprecationHit>();

/** Caps so a busy endpoint cannot grow these unboundedly. */
const MAX_TRACKED_USERS = 50;
const MAX_TRACKED_AGENTS = 20;

/**
 * A browser always sends Origin on cross-origin XHR; a native app or a server
 * script generally sends none. This is a strong hint, not proof — which is why
 * the raw value is logged alongside the classification.
 */
function classifyClient(origin: string | undefined, userAgent: string | undefined): ClientType {
  if (origin) return 'web';
  if (!userAgent) return 'unknown';
  if (/mozilla|chrome|safari|firefox|edge/i.test(userAgent)) return 'web';
  return 'native-or-server';
}

function record(key: string, hit: Omit<DeprecationHit, 'count' | 'clientTypes' | 'userIds' | 'userAgents'>, clientType: ClientType, userId?: string, userAgent?: string) {
  const existing = registry.get(key);

  if (!existing) {
    registry.set(key, {
      ...hit,
      count: 1,
      clientTypes: { web: 0, 'native-or-server': 0, unknown: 0, [clientType]: 1 },
      userIds: userId ? [userId] : [],
      userAgents: userAgent ? [userAgent] : [],
    });
    return;
  }

  existing.count += 1;
  existing.lastAccess = hit.lastAccess;
  existing.lastStatus = hit.lastStatus;
  existing.clientTypes[clientType] += 1;

  if (userId && !existing.userIds.includes(userId) && existing.userIds.length < MAX_TRACKED_USERS) {
    existing.userIds.push(userId);
  }
  if (userAgent && !existing.userAgents.includes(userAgent) && existing.userAgents.length < MAX_TRACKED_AGENTS) {
    existing.userAgents.push(userAgent);
  }
}

/**
 * Router-level middleware. Mount at the top of a deprecated router with
 * `router.use(deprecated('auth'))`.
 *
 * Mounted inside the router rather than on the path in server.ts because
 * /api/users and /api/rides host a platform router *and* a legacy one on the
 * same prefix. A path-level hook there would attribute live platform traffic to
 * the legacy router; this only fires once a request has fallen through to the
 * deprecated one.
 */
export function deprecated(router: string) {
  return function deprecationLogger(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!isEnabled()) {
      next();
      return;
    }

    res.on('finish', () => {
      /**
       * Express sets req.route only when a route in this router matched. Without
       * this check, a URL that no router handles would be logged as legacy usage
       * on its way to the 404, inflating every count with noise.
       */
      if (!req.route) return;

      const origin = req.headers.origin;
      const userAgent = req.headers['user-agent'];
      const clientType = classifyClient(origin, userAgent);
      const timestamp = new Date().toISOString();
      const route = req.route?.path ?? req.path;
      const key = `${router} ${req.method} ${route}`;

      record(
        key,
        {
          router,
          route,
          method: req.method,
          lastAccess: timestamp,
          lastStatus: res.statusCode,
        },
        clientType,
        req.user?.userId,
        userAgent,
      );

      console.warn(
        `[DEPRECATED] ${req.method} ${req.originalUrl} -> ${res.statusCode} | router=${router}` +
          ` | uid=${req.user?.userId ?? 'anon'}` +
          ` | origin=${origin ?? 'ABSENT(native?)'}` +
          ` | ua=${userAgent ?? 'none'}` +
          ` | client=${clientType}` +
          ` | at=${timestamp}`,
      );
    });

    next();
  };
}

/** Snapshot for the stage-6 usage report, most-used first. */
export function getDeprecationReport(): DeprecationHit[] {
  return [...registry.values()].sort((a, b) => b.count - a.count);
}

/**
 * In-memory only, so it resets on deploy and does not survive a restart. Deploy
 * logs are the durable record; this exists for a quick read without grepping
 * them. Do not treat an empty registry after a restart as proof of no traffic.
 */
export function resetDeprecationReport(): void {
  registry.clear();
}
