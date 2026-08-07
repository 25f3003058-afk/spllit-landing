/**
 * Single source of truth for environment configuration.
 * Nothing in the app reads process.env directly — everything goes through here
 * so a missing key fails loudly in one place instead of silently at runtime.
 */

export type AppEnv = 'development' | 'staging' | 'production';

function required(value: string | undefined, key: string): string {
  if (!value) {
    // Fail loudly in dev/build, but don't crash a running production page over a
    // non-critical key — callers that truly need it will surface the empty string.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[config] Missing required env var: ${key}`);
    }
    return '';
  }
  return value;
}

const env = (process.env.NEXT_PUBLIC_ENV ?? 'development') as AppEnv;

export const config = {
  env,
  isProd: env === 'production',

  /**
   * Express + Socket.IO backend, running in a Cloudflare Container behind a
   * Worker. REST and websockets share one origin.
   */
  api: {
    /** Includes the /api prefix, e.g. https://api.spllit.app/api */
    baseUrl: required(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL'),
    /** Same host without the /api suffix — Socket.IO mounts at the root. */
    socketUrl: required(process.env.NEXT_PUBLIC_SOCKET_URL, 'NEXT_PUBLIC_SOCKET_URL'),
  },

  /** Firebase is used for identity only — Google Sign-In and Phone OTP. */
  firebase: {
    apiKey: required(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 'NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: required(
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    ),
    projectId: required(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    ),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: required(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, 'NEXT_PUBLIC_FIREBASE_APP_ID'),
    /**
     * Realtime Database URL. Part of the standard Firebase web config, so it is
     * carried through to initializeApp — but nothing in the app reads from RTDB
     * today. Live positions, presence and typing go over Socket.IO to the
     * Mongo/Express backend. See the note in lib/firebase.ts.
     */
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
    /** Analytics measurement id. Carried through; getAnalytics() is not called. */
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
  },

  mapbox: {
    /** Public token — client-side rendering only. Directions/ETA use a server token. */
    token: required(process.env.NEXT_PUBLIC_MAPBOX_TOKEN, 'NEXT_PUBLIC_MAPBOX_TOKEN'),
    /**
     * `streets-v12`, not `light-v11`. The light style is deliberately
     * desaturated to sit *under* dense data — with only a handful of markers
     * on it, it reads as a blank grey sheet and takes the whole screen down
     * with it. Streets keeps parks, water and road hierarchy, which is what
     * makes a map look like a place.
     */
    styleLight:
      process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT ?? 'mapbox://styles/mapbox/streets-v12',
    styleDark:
      process.env.NEXT_PUBLIC_MAPBOX_STYLE_DARK ?? 'mapbox://styles/mapbox/navigation-night-v1',
  },

  /** Fallback camera when geolocation is denied or unavailable. */
  defaultLocation: {
    lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? 80.2367),
    lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? 12.9915),
    zoom: Number(process.env.NEXT_PUBLIC_DEFAULT_ZOOM ?? 12),
    label: process.env.NEXT_PUBLIC_DEFAULT_PLACE ?? 'Chennai',
  },
} as const;

export type Config = typeof config;
