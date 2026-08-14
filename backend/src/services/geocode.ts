/**
 * Turning a place *name* into a place.
 *
 * Lifted out of `routes/search.ts`, which owned the only copy, because the
 * squad-intent extractor needs exactly this and must not have its own. A second
 * geocoder would drift from the first, and the two would disagree about where
 * "Velachery" is — one answering the search screen, the other answering the
 * form that creates a squad going there.
 *
 * The server token is used, never the public one. Mapbox bills these, and the
 * public token in the browser is scoped to autocomplete for that reason.
 */

const MAPBOX_TOKEN = process.env.MAPBOX_SECRET_TOKEN ?? process.env.MAPBOX_TOKEN ?? '';

export interface GeocodedPlace {
  id: string;
  /** The distinctive part: "Velachery", "IIT Madras". */
  name: string;
  /** The full line: "Velachery, Chennai, Tamil Nadu, India". */
  address: string;
  center: [number, number];
}

/** As above, plus what Mapbox called it — needed to judge how precise it is. */
export interface ResolvedPlace extends GeocodedPlace {
  /** Mapbox's own type: `poi`, `address`, `place`, `locality`… */
  featureType: string | null;
}

/**
 * The Search Box shape, which is not the Geocoding v5 shape.
 *
 * Mirrors `SearchBoxFeature` in `lib/place-feature.ts`. Duplicated rather than
 * imported because the two builds do not share a module graph — the web app
 * resolves `@/*` through Next, this compiles to NodeNext ESM — and a copied
 * interface is cheaper to keep honest than a shared package would be. If the
 * two ever disagree, the frontend's is the one that has been proved against
 * real responses.
 */
interface SearchBoxFeature {
  geometry?: { coordinates?: number[] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    feature_type?: string;
    place_formatted?: string;
    coordinates?: { longitude?: number; latitude?: number };
  };
}

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  place_type?: string[];
  relevance?: number;
}

/**
 * One call to Mapbox forward geocoding. Empty array on any failure.
 *
 * Never throws: both callers treat "no places" as an ordinary result — the
 * search screen shows the other five result types, and the extractor leaves the
 * field blank for the user to fill. Neither wants an exception for a provider
 * having a bad minute.
 */
async function forward(
  query: string,
  near: { lat: number; lng: number } | null,
  limit: number,
): Promise<MapboxFeature[]> {
  if (!MAPBOX_TOKEN) return [];
  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    );
    url.searchParams.set('access_token', MAPBOX_TOKEN);
    url.searchParams.set('limit', String(limit));
    // Proximity is what makes "Velachery" resolve to the one the user meant
    // rather than the first alphabetically in the country.
    if (near) url.searchParams.set('proximity', `${near.lng},${near.lat}`);

    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const payload = (await response.json()) as { features?: MapboxFeature[] };
    return payload.features ?? [];
  } catch (error) {
    console.error('[geocode]', error);
    return [];
  }
}

/** Candidates for the search screen. The shape it has always rendered. */
export async function geocodePlaces(
  query: string,
  near: { lat: number; lng: number } | null,
): Promise<GeocodedPlace[]> {
  const features = await forward(query, near, 5);
  return features.map((feature) => ({
    id: feature.id,
    name: feature.text,
    address: feature.place_name,
    center: feature.center,
  }));
}

/**
 * The single best match for a name, or null if nothing is good enough.
 *
 * Null rather than a shaky guess, because of what the caller does with it: a
 * resolved place becomes a squad's destination on a card other people read and
 * travel to. A wrong coordinate that looks plausible is worse here than an
 * empty field, since the empty field is visibly incomplete and the wrong one is
 * not. The user is asked; they are never quietly sent somewhere.
 *
 * **Search Box, not Geocoding v5**, and the difference is not a preference.
 * v5 has almost no POI coverage in India: asked for "IIT Madras" it answers
 * with roads and localities near the campus and never the campus, because the
 * feature is not in that index. This function did use v5 — inherited from the
 * search screen — and a live run resolved "IIT Madras" to Gandhi Mandapam
 * Flyover, 1.8 km away, which is exactly the shape of failure this whole design
 * exists to prevent: a correct name attached to the wrong point, arriving on a
 * form the user is about to confirm. `lib/place-feature.ts` had already written
 * this down for the picker; the fix is to obey it here too.
 */
export async function resolvePlace(
  query: string,
  near: { lat: number; lng: number } | null,
): Promise<ResolvedPlace | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;
  if (!MAPBOX_TOKEN) return null;

  try {
    const url = new URL('https://api.mapbox.com/search/searchbox/v1/forward');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('access_token', MAPBOX_TOKEN);
    /**
     * More than one, though only the first is used.
     *
     * Search Box has no relevance score — it expresses confidence purely by
     * ordering — so there is no threshold to test a lone result against. Asking
     * for a few and taking the top is the same decision the picker makes when a
     * user accepts the first row without reading the rest.
     */
    url.searchParams.set('limit', '5');
    // The app is India-only, and without this a bare "Velachery" can match a
    // similarly-named place on another continent and outrank the real one.
    url.searchParams.set('country', 'IN');
    /**
     * Without this Mapbox answers in the feature's own script, so a Tamil
     * sentence naming "IIT Madras" can come back in Tamil script — unreadable
     * against what the user typed, and wrong on a card their squad reads.
     */
    url.searchParams.set('language', 'en');
    if (near) url.searchParams.set('proximity', `${near.lng},${near.lat}`);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const payload = (await response.json()) as { features?: SearchBoxFeature[] };
    for (const feature of payload.features ?? []) {
      const parsed = parseSearchBox(feature);
      if (parsed) return parsed;
    }
    return null;
  } catch (error) {
    console.error('[geocode/resolve]', error);
    return null;
  }
}

/** Null for a feature missing an id or a coordinate — there is nothing to use. */
function parseSearchBox(feature: SearchBoxFeature): ResolvedPlace | null {
  const properties = feature.properties;
  const id = properties?.mapbox_id;
  if (!id) return null;

  const lng = feature.geometry?.coordinates?.[0] ?? properties?.coordinates?.longitude;
  const lat = feature.geometry?.coordinates?.[1] ?? properties?.coordinates?.latitude;
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;

  const name = properties?.name?.trim();
  if (!name) return null;

  return {
    id,
    name,
    // The context hierarchy without the name — "Chennai, Tamil Nadu, India".
    // Empty rather than absent is normalised to null: there is no such thing
    // as a blank address, and storing one makes an unplaced point look placed.
    address: properties?.place_formatted?.trim() || '',
    center: [lng, lat],
    featureType: properties?.feature_type ?? null,
  };
}
