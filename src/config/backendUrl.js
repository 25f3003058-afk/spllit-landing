// Default backend URLs
const DEFAULT_RENDER_BACKEND_URL = 'https://spllit-landing.onrender.com/api';
const DEFAULT_WORKERS_API_URL = 'https://api.spllit.app/api';

// Environment-specific URLs
const RENDER_BACKEND_URL = import.meta.env.VITE_RENDER_BACKEND_URL || DEFAULT_RENDER_BACKEND_URL;
const WORKERS_API_URL = import.meta.env.VITE_WORKERS_API_URL || DEFAULT_WORKERS_API_URL;

// Determine which backend to use for each endpoint
const WORKERS_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/firebase-login',
  '/auth/google',
  '/auth/refresh-token',
  '/auth/verify-email',
  '/announcements',
  '/rides/search',
  '/users/'  // GET /users/:id
];

/**
 * Determines whether an endpoint should be routed to Cloudflare Workers
 * or Render backend based on the path
 */
export function isWorkersEndpoint(path) {
  return WORKERS_ENDPOINTS.some(endpoint => path.includes(endpoint));
}

/**
 * Gets the appropriate API base URL for the given endpoint
 */
export function getApiUrl(path) {
  if (isWorkersEndpoint(path)) {
    return WORKERS_API_URL;
  }
  return RENDER_BACKEND_URL;
}

/**
 * Constructs a full URL for an API endpoint
 */
export function getFullApiUrl(path) {
  const baseUrl = getApiUrl(path);
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Legacy exports for backward compatibility
const normalizeApiUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return RENDER_BACKEND_URL;
  }

  let url = value.trim();
  if (!url) {
    return RENDER_BACKEND_URL;
  }

  if (url.includes('railway.app') || url.includes('srv-d6o6nji4d50c73fdl27g.onrender.com')) {
    return RENDER_BACKEND_URL;
  }

  url = url.replace(/\/$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }

  return url;
};

// Default to Render backend for backward compatibility
export const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_RENDER_BACKEND_URL);
export const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
