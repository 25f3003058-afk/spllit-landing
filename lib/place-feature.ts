/**
 * Reading a Mapbox feature back as two lines a human recognises.
 *
 * Pure and dependency-free, in its own module for the same reason
 * `place-ranking` is: whether a result reads as the place someone meant has a
 * right and a wrong answer, and that is worth checking over a fixed set of
 * API-shaped features without a browser, a token or a network.
 *
 * Two shapes live here because the app deliberately uses two APIs:
 *
 *   Search Box `/forward`   — typing a name into the picker.
 *   Geocoding v5 reverse    — dropping a pin on the map.
 *
 * Neither can do the other's job. Geocoding v5 has almost no POI coverage in
 * India — searching "IIT Madras Research Park" against it returns roads and
 * localities and never the building, whatever `types` and `proximity` it is
 * given, because the feature is simply not in that index. Search Box has it,
 * along with every branch of a chain by name. Reverse is the mirror image:
 * Search Box `/reverse` answers a pin in the middle of that same campus with
 * "Way inside IITM RP" and an empty address, where v5 gives a usable street.
 * So each call goes to the index that actually holds the answer.
 */

import type { LngLat } from '@/types';

export interface PlaceLines {
  /** What the place is called. */
  name: string;
  /** Where it is. Never a repeat of the name; null when nothing was left. */
  address: string | null;
  /**
   * The API's own feature type, e.g. `poi`. Undefined when it did not say.
   *
   * Carried out of here rather than being consumed and discarded, because it is
   * the answer to "what is this coordinate" and that is worth storing. The
   * *derived* precision integer is not — see `featurePrecision`.
   */
  featureType?: string | undefined;
}

/** A parsed result, ready for ranking and for `pick`. */
export interface ParsedPlace extends PlaceLines {
  id: string;
  /** Exactly what the API returned for this feature. Never substituted. */
  center: LngLat;
  /** The API's own feature type, e.g. `poi`. Scored by `featurePrecision`. */
  featureType: string | undefined;
}

/**
 * Three parts. A fourth still truncates at 320px, so it costs a row of height
 * without ever being read.
 */
const MAX_ADDRESS_PARTS = 3;

/**
 * Joins the parts that survive, in order, dropping blanks and anything already
 * said. `name` seeds the seen-set because a city's `place` context repeats the
 * city's own name, and "Chennai / Chennai, Tamil Nadu" is not an address.
 */
function joinParts(parts: (string | undefined)[], name: string): string | null {
  const seen = new Set([name.trim().toLowerCase()]);
  const kept: string[] = [];

  for (const part of parts) {
    const value = part?.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(value);
    if (kept.length === MAX_ADDRESS_PARTS) break;
  }

  return kept.length > 0 ? kept.join(', ') : null;
}

/**
 * Mapbox's Indian address strings are separated by U+060C, the Arabic comma,
 * as often as by an ordinary one — "Kannagam Road ، 600113 Chennai، India".
 * Anything that splits an address has to accept both or it silently fails to
 * split at all.
 */
const SEPARATORS = /[،,]/;

/** A postcode or the country every result of a country-scoped search shares. */
function isNoise(part: string): boolean {
  return /^\d{3,6}$/.test(part) || part.toLowerCase() === 'india';
}

/**
 * Splits one of those formatted strings into parts worth showing.
 *
 * Used only where structured context is missing, which is exactly where the
 * string is at its worst — so the postcode and the country are dropped here
 * rather than being rendered as though they were an address.
 */
function splitFormatted(formatted: string | undefined): string[] {
  if (!formatted) return [];
  return formatted
    .split(SEPARATORS)
    .map((part) =>
      // Mapbox separates parts with a comma but joins the postcode to the city
      // with a space — "، 600113 Chennai،" — so a part has to be stripped as
      // well as filtered, or the city arrives wearing its postcode.
      part
        .trim()
        .replace(/^\d{3,6}\s+/, '')
        .replace(/\s+\d{3,6}$/, '')
        .trim(),
    )
    .filter((part) => part.length > 0 && !isNoise(part));
}

// --- Search Box /forward ----------------------------------------------------

/** The subset of a Search Box feature this app reads. */
export interface SearchBoxFeature {
  geometry?: { coordinates?: number[] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    feature_type?: string;
    /** The context hierarchy as one string, without the name. */
    place_formatted?: string;
    /** Keyed by feature type — `context.place.name` is the city. */
    context?: Record<string, { name?: string } | undefined>;
    coordinates?: { longitude?: number; latitude?: number };
  };
}

/**
 * Some `street` features carry the entire formatted address in `name`:
 * "Kannagam Road ، 600113 Chennai، India". Rendering that as the primary line
 * puts the postcode and the country in the one place on the row that has to be
 * scannable.
 *
 * The tail is only cut when it actually looks like an address tail, so a name
 * that legitimately contains a comma — "Zudio - Fortune Tower, Sambalpur" —
 * survives intact.
 */
function cleanName(raw: string): string {
  const head = raw.split(SEPARATORS)[0]?.trim();
  if (!head) return raw.trim();
  const tail = raw.slice(head.length);
  return /\b\d{3,6}\b|india/i.test(tail) ? head : raw.trim();
}

/**
 * One Search Box feature.
 *
 * Null when there is no id or no coordinates: a row that cannot be selected, or
 * that would resolve to nowhere, is worse than one that was never offered.
 */
export function parseSearchBoxFeature(feature: SearchBoxFeature): ParsedPlace | null {
  const properties = feature.properties;
  const id = properties?.mapbox_id;
  if (!id) return null;

  const lng = feature.geometry?.coordinates?.[0] ?? properties?.coordinates?.longitude;
  const lat = feature.geometry?.coordinates?.[1] ?? properties?.coordinates?.latitude;
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;

  const raw = properties?.name?.trim() || '';
  const name = cleanName(raw);
  if (!name) return null;

  const context = properties?.context;
  const parts = [
    // The street it stands on...
    context?.street?.name,
    // ...one neighbourhood-scale part, the finer of the two when both exist...
    context?.neighborhood?.name ?? context?.locality?.name,
    // ...and then the city and the state, which are what tell four branches of
    // the same chain apart. `postcode`, `district` and `country` are left out:
    // the first two are noise at a glance and the third is the same word on
    // every result of a country-scoped search.
    context?.place?.name,
    context?.region?.name,
  ];

  return {
    id,
    name,
    address:
      joinParts(parts, name) ??
      joinParts(splitFormatted(properties?.place_formatted), name) ??
      /**
       * Last resort: the tail `cleanName` cut off the name.
       *
       * The `street` features that carry a whole formatted address in `name`
       * arrive with no `context` and an empty `place_formatted`, so without this
       * the city was thrown away with the postcode and the row rendered as a
       * bare street with no address at all. Worse, `trimTrailingArea` reads the
       * address to decide which trailing word is an area — so a null here was
       * silently disabling the promotion of exactly the feature that needs it,
       * and "Sardar Patel Road Chennai" still led with an Airtel store.
       */
      joinParts(splitFormatted(raw), name),
    center: [lng, lat],
    featureType: properties?.feature_type,
  };
}

// --- Geocoding v5, reverse only ---------------------------------------------

/**
 * The subset of a Geocoding v5 feature this app reads.
 *
 * Everything after `center` is optional because the API omits it per feature
 * type — only `poi` carries `properties.address`, only `address` carries a
 * house number in `address`, and a `country` has no `context` at all.
 */
export interface GeocodeFeature {
  id: string;
  text?: string;
  place_name?: string;
  center: LngLat;
  /** The feature's own type is the first entry, e.g. `["poi"]`. */
  place_type?: string[];
  /** House number. `address` features only — `text` holds the street. */
  address?: string;
  properties?: {
    /** Street line. `poi` features only. */
    address?: string;
  };
  /** Enclosing features, fine to coarse. Each id is prefixed with its type. */
  context?: { id?: string; text?: string }[];
}

/** Pulls one enclosing feature out of v5's `context` array by its type prefix. */
function contextText(feature: GeocodeFeature, type: string): string | undefined {
  return feature.context?.find((entry) => entry.id?.split('.')[0] === type)?.text;
}

/**
 * A v5 feature's name and address, built from its parts rather than from
 * `place_name`.
 *
 * `place_name` is one long string that repeats the name, spells out the
 * postcode and ends in "India" on every result of a `country=IN` lookup — so it
 * truncates before it reaches the part that says where the pin actually is.
 */
export function describeFeature(feature: GeocodeFeature): PlaceLines {
  const type = feature.place_type?.[0];
  const base = feature.text?.trim() || splitFormatted(feature.place_name)[0] || '';

  // An `address` feature keeps its house number outside `text`, so the number
  // and the street are only a usable name together.
  const name = type === 'address' && feature.address ? `${feature.address} ${base}`.trim() : base;

  const parts = [
    // Only a `poi` has a street of its own to add; on an `address` feature that
    // same string is already the name.
    type === 'poi' ? feature.properties?.address : undefined,
    contextText(feature, 'neighborhood') ?? contextText(feature, 'locality'),
    contextText(feature, 'place'),
    contextText(feature, 'region'),
  ];

  const fromContext = joinParts(parts, name);
  if (fromContext) return { name, address: fromContext, featureType: type };

  // Last resort: the formatted string minus its own leading name, which is
  // otherwise printed twice — "Fortune Tower" over "Fortune Tower, Ring Road…".
  const rest = splitFormatted(feature.place_name).filter(
    (part) => part.toLowerCase() !== name.toLowerCase(),
  );
  return { name, address: joinParts(rest, name), featureType: type };
}
