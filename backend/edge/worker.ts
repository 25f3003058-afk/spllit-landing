import { Container, getContainer } from '@cloudflare/containers';

/**
 * Cloudflare Workers entry point for the Spllit API.
 *
 * The Worker itself does no application work — it forwards every request to a
 * container running the existing Express + Socket.IO server unchanged. That is
 * what lets Prisma/MongoDB, firebase-admin and Socket.IO keep working: a
 * container can open raw TCP and hold long-lived connections, which a plain
 * Worker cannot.
 */

interface Env {
  BACKEND: DurableObjectNamespace<SpllitBackend>;

  // Non-secret config, set in wrangler.jsonc `vars`.
  NODE_ENV: string;
  FRONTEND_URL: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;

  // Secrets, set with `wrangler secret put <NAME>`.
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  MAPBOX_SECRET_TOKEN: string;
  /**
   * Razorpay credentials for the ₹2 squad join fee. Optional so a deploy
   * without them still serves everything else — payments answer 503 rather
   * than the container refusing to start.
   */
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  OPENAI_API_KEY?: string;
}

export class SpllitBackend extends Container<Env> {
  /** Must match EXPOSE/PORT in the Dockerfile. */
  override defaultPort = 8080;

  /**
   * Kept long so a quiet campus at 3am doesn't cold-start the next request.
   * Sleeping also drops every Socket.IO connection, so this is a UX setting as
   * much as a cost one.
   */
  override sleepAfter = '30m';

  /**
   * Secrets reach the container as ordinary environment variables, so
   * `process.env.DATABASE_URL` works exactly as it does locally. Anything not
   * listed here is simply absent inside the container.
   */
  override envVars = {
    NODE_ENV: this.env.NODE_ENV,
    PORT: '8080',
    FRONTEND_URL: this.env.FRONTEND_URL,
    JWT_EXPIRES_IN: this.env.JWT_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: this.env.JWT_REFRESH_EXPIRES_IN,
    DATABASE_URL: this.env.DATABASE_URL,
    JWT_SECRET: this.env.JWT_SECRET,
    JWT_REFRESH_SECRET: this.env.JWT_REFRESH_SECRET,
    FIREBASE_PROJECT_ID: this.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: this.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: this.env.FIREBASE_PRIVATE_KEY,
    MAPBOX_SECRET_TOKEN: this.env.MAPBOX_SECRET_TOKEN,
    /**
     * Anything absent from this list is simply not present in the container.
     * These two were missing, so the join-fee endpoints answered 503 in
     * production no matter what `wrangler secret put` had been given — the
     * secret existed on the Worker but never reached the Express process.
     */
    ...(this.env.RAZORPAY_KEY_ID ? { RAZORPAY_KEY_ID: this.env.RAZORPAY_KEY_ID } : {}),
    ...(this.env.RAZORPAY_KEY_SECRET
      ? { RAZORPAY_KEY_SECRET: this.env.RAZORPAY_KEY_SECRET }
      : {}),
    ...(this.env.OPENAI_API_KEY ? { OPENAI_API_KEY: this.env.OPENAI_API_KEY } : {}),
  };

  override onStart() {
    console.log('[container] Spllit API started');
  }

  override onError(error: unknown) {
    console.error('[container] error:', error);
    return new Response('Backend unavailable', { status: 503 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    /**
     * SINGLE INSTANCE, DELIBERATELY.
     *
     * Socket.IO keeps connection state in the process. Spreading traffic over
     * several containers would break it: a client's polling handshake could
     * land on a different instance than its websocket, and rooms would only
     * ever contain the members that happen to share a process.
     *
     * One named instance means every request and socket lands in the same
     * container, which is correct but caps throughput at one container.
     * To scale horizontally later, add a Socket.IO Redis adapter first, then
     * switch this to `getContainer(env.BACKEND, request.headers.get('cf-ray'))`
     * or another distribution key.
     */
    return getContainer(env.BACKEND, 'spllit-api-singleton').fetch(request);
  },
};
