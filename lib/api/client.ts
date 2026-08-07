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

  const url = new URL(`${baseFor(path)}${path}`);
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
  } catch {
    // Network-level failure — surfaced as a retryable error so React Query can
    // back off rather than rendering a hard error state on a flaky connection.
    throw new ApiError('Network unavailable. Check your connection.', 0, 'network');
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
