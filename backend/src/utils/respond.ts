import { Response } from 'express';

/**
 * Response envelope for the platform routes (squads, events, communities,
 * chat, notifications, waitlist, search).
 *
 * The web client unwraps `{ success, data }` automatically. Legacy routes
 * (auth, rides, matches, users, admin) keep their existing shapes untouched so
 * mobile clients are not broken by this addition.
 */
export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res: Response, status: number, message: string, code?: string) {
  return res.status(status).json({ success: false, message, ...(code ? { code } : {}) });
}

/** Wraps an async handler so a thrown error becomes a 500 instead of a hang. */
export function guard(
  handler: (...args: never[]) => Promise<unknown>,
  label: string,
) {
  return async (...args: never[]) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error(`[${label}]`, error);
      const res = args[1] as unknown as Response;
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Something went wrong' });
      }
    }
  };
}

/** Degrees of latitude per metre — used for cheap bounding-box prefilters. */
const DEG_PER_METRE = 1 / 111_320;

/**
 * Bounding box around a point. Mongo geospatial indexes are not configured on
 * these collections, so range queries on plain lat/lng fields are the portable
 * option; the box is a prefilter and exact distance is computed after.
 */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const deltaLat = radiusKm * 1000 * DEG_PER_METRE;
  const deltaLng = deltaLat / Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: lng - deltaLng,
    maxLng: lng + deltaLng,
  };
}

export function parseCoords(query: Record<string, unknown>) {
  const lat = Number(query.lat);
  const lng = Number(query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
