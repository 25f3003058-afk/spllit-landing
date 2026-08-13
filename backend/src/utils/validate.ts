import { z } from 'zod';
import { Response } from 'express';

import { fail } from './respond.js';

/**
 * Request validation for the platform routes.
 *
 * These routes parsed `req.body` by hand — `String(req.body.name)`,
 * `Number(req.query.limit)` — which coerces rather than validates. That is not
 * an injection risk (Prisma parameterises every query), but it means the
 * boundary accepts nonsense and pushes the consequences inward: `Number('abc')`
 * is NaN, `String(undefined)` is the literal "undefined", and a 10MB string in
 * a name field is stored happily.
 *
 * The point of validating here is to make the failure mode a 400 with a
 * readable message instead of a 500 three layers down, or a row of garbage.
 */

/** Parses a body, answering 400 with field paths on failure. */
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
  res: Response,
): z.infer<T> | null {
  const result = schema.safeParse(body);
  if (result.success) return result.data;

  /**
   * The first error only. Listing every failure invites a client to be
   * rewritten around the list, and the first one is what the person needs to
   * fix anyway.
   */
  const issue = result.error.issues[0];
  const where = issue?.path.length ? `${issue.path.join('.')}: ` : '';
  fail(res, 400, `${where}${issue?.message ?? 'Invalid request'}`, 'invalid-input');
  return null;
}

/** Same, for query strings. */
export function parseQuery<T extends z.ZodTypeAny>(
  schema: T,
  query: unknown,
  res: Response,
): z.infer<T> | null {
  return parseBody(schema, query, res);
}

// --- Shared field schemas -------------------------------------------------

/**
 * Trimmed, bounded text. The max matters: without it a single request can store
 * a megabyte in a display field that every list view then renders.
 */
export const text = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

/** A real coordinate, not merely a number. */
export const latitude = z.coerce.number().min(-90).max(90);
export const longitude = z.coerce.number().min(-180).max(180);

/**
 * How a coordinate was chosen. Mirrors `GeoPoint.source` in the schema.
 *
 * An enum here and a plain string in `featureType` below, on purpose: this is our
 * own vocabulary and a value outside it is a bug worth rejecting, while feature
 * types are Mapbox's and will grow. Enumerating theirs would mean a new provider
 * type silently failing validation and the field arriving null.
 */
export const GEO_SOURCES = ['search', 'manual', 'device', 'suggestion'] as const;

/** Wider than any real distance we would record, and not a claim about the cap. */
const MAX_METRES = 100_000;

export const geoPoint = z.object({
  lat: latitude,
  lng: longitude,
  label: z.string().trim().max(300).nullish(),
  address: z.string().trim().max(500).nullish(),

  /** The provider's own type, e.g. `poi`. Never the derived ranking integer. */
  featureType: z.string().trim().toLowerCase().max(40).nullish(),
  /** Only ever written on a positive confirmation, so it cannot be negative. */
  roadDistanceMetres: z.number().min(0).max(MAX_METRES).nullish(),
  source: z.enum(GEO_SOURCES).nullish(),
  /**
   * Strictly positive: a fix accurate to zero metres does not exist, and a client
   * sending 0 means "I did not measure this", which is what null is for.
   */
  accuracyMetres: z.number().positive().max(MAX_METRES).nullish(),
});

export type GeoPointInput = z.infer<typeof geoPoint>;

/** An ISO datetime that is actually parseable. */
export const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Must be a valid date');

/** Mongo/cuid ids are opaque here — length-bounded, so a huge string cannot
 *  reach the database as a lookup key. */
export const id = z.string().trim().min(1).max(64);

/** Paging. Coerced because query strings are always strings. */
export const paging = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().trim().max(200).optional(),
});
