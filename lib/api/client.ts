import { config } from '@/lib/config';

/**
 * Thin fetch wrapper over the Spllit API.
 *
 * One origin: the Cloudflare Worker in front of the container serves every
 * route, so there is no edge/origin split to keep in sync.
 */
function baseFor(_path: string): string {
  return config.api.baseUrl;
}

export class ApiError extends Error {
  constructor(
    override readonly message: string,
    readonly status: number,
    readonly code?: string,
    /**
     * The parsed error body. Some failures carry data the caller needs to
     * recover — a 409 on a username comes back with free alternatives — and
     * that is lost if only the message survives.
     */
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Reads a string array off the error body, ignoring anything malformed. */
  stringList(key: string): string[] {
    const value = this.details?.[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

/**
 * Token accessor. Set once by the auth provider so the client layer never
 * imports Firebase — keeps this module usable from tests and server code.
 */
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: (() => Promise<string | null>) | null) {
  tokenGetter = fn;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Skip attaching the auth token (public endpoints). */
  anonymous?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, anonymous, headers, ...rest } = options;

  /**
   * A missing NEXT_PUBLIC_API_URL used to take the whole app down in a way
   * that pointed nowhere near the cause.
   *
   * config.api.baseUrl falls back to '' when the variable is unset, so this
   * became `new URL('/auth/profile')` — and a bare path is not a valid
   * absolute URL, so it threw `TypeError: Invalid URL`. That throw happens
   * *before* the try/catch around fetch(), so none of the network-error
   * handling below ever ran: every call, on every screen, died with a browser
   * type error and no mention of configuration.
   *
   * The variable is inlined at build time, so an empty value here means the
   * deployed bundle can never reach the API no matter what runs server-side.
   * That is a deployment fault, not something a user can retry past — say so
   * once, clearly, instead of failing as if the network blipped.
   */
  const base = baseFor(path);
  if (!base) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[api] NEXT_PUBLIC_API_URL is not set. It is compiled into the bundle ' +
          'at build time — set it in .env.local for development, or in the ' +
          "hosting provider's BUILD environment and redeploy.",
      );
    }
    throw new ApiError(
      "Spllit isn't configured to reach its server. This is a problem on our side, not yours.",
      0,
      'api_url_missing',
    );
  }

  let url: URL;
  try {
    url = new URL(`${base}${path}`);
  } catch {
    throw new ApiError(
      "Spllit isn't configured to reach its server. This is a problem on our side, not yours.",
      0,
      'api_url_invalid',
    );
  }

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const finalHeaders = new Headers(headers);
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (!anonymous && tokenGetter) {
    const token = await tokenGetter();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...rest,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (error) {
    /**
     * A caller who aborted deliberately is not a failure, and must not be
     * described as one.
     *
     * Everything below this is about a request that could not be delivered, and
     * all of it is wrong for a request that was withdrawn: telling someone who
     * pressed Cancel to check their connection blames them for a broken network
     * that is working fine. Checked first so no other branch can claim it.
     */
    if (rest.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
      throw new ApiError('Request cancelled.', 0, 'aborted');
    }

    /**
     * fetch() rejects for two very different reasons and cannot tell them
     * apart: the device is offline, or the API host refused the connection.
     *
     * The old copy asserted the first ("check your connection"), which sent
     * people to reset their wifi when the real cause was a backend that was not
     * running — the message people saw after a *successful* Google sign-in,
     * because the sign-in itself talks to Firebase and only the profile call
     * touches our server. navigator.onLine settles it: it is unreliable for
     * proving you are online, but a false is conclusive proof you are not.
     */
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

    if (offline) {
      throw new ApiError("You're offline. Check your connection and try again.", 0, 'network');
    }

    /**
     * In development the overwhelmingly likely cause is that the API process is
     * simply not running — Spllit needs Next on :3000 *and* Express on :3001,
     * and starting only the first produces a sign-in that fails at the last
     * step with no clue why. Say so, rather than blaming an outage.
     */
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[api] Could not reach ${config.api.baseUrl}. Is the API running? Start both with: npm run dev`,
      );
      throw new ApiError(
        `Can't reach the API at ${config.api.baseUrl}. If you are developing, run "npm run dev" from the project root — it starts the web app and the API together.`,
        0,
        'network',
      );
    }

    throw new ApiError(
      "Can't reach Spllit right now. The service may be down — try again in a moment.",
      0,
      'network',
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const record = (payload ?? {}) as Record<string, unknown>;
    const message =
      (typeof record.message === 'string' && record.message) ||
      (typeof record.error === 'string' && record.error) ||
      `Request failed (${response.status})`;
    throw new ApiError(
      message,
      response.status,
      typeof record.code === 'string' ? record.code : undefined,
      record,
    );
  }

  // The Express layer wraps successful payloads as { success, data }. Unwrap so
  // callers only ever deal with the domain object.
  const record = payload as Record<string, unknown> | null;
  if (record && typeof record === 'object' && 'data' in record && 'success' in record) {
    return record.data as T;
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
