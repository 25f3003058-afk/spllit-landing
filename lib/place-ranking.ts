/**
 * Ranking for place-search results.
 *
 * Pure and dependency-free, in its own module rather than inside the picker,
 * because this is the part with a right and a wrong answer — it is worth being
 * able to run it over a fixed set of candidates and check the order, which is
 * not possible from inside a React component.
 */

export interface RankablePlace {
  /** The feature's own short name, e.g. "Fortune Tower". */
  name: string;
  /** The rendered second line — street, area, city. Used by `trimTrailingArea`. */
  address: string | null;
  /** Mapbox's 0–1 match confidence. */
  relevance: number;
  /** Great-circle distance from the search reference point. */
  distanceKm: number;
  /** How specific the feature type is — see `featurePrecision`. */
  precision: number;
}

/**
 * A city — the coarsest thing anyone ever means as a destination, and so the
 * value both the default and the cut-off are pinned to.
 */
const PLACE_PRECISION = 5;

/** The finest feature type that is still an *area* rather than a building. */
const NEIGHBORHOOD_PRECISION = 3;

/**
 * How specific each Mapbox feature type is, 0 being somewhere you can actually
 * stand and be met.
 *
 * This is a ranking judgement rather than a property of the API, which is why
 * it lives here and not next to the feature parsing: Mapbox returns the type,
 * this file decides what a type is worth. A destination picker wants the
 * building; it never wants the postcode or the state, both of which come back
 * from ordinary searches and both of which are useless to someone trying to
 * meet a group somewhere.
 *
 * Search Box and Geocoding v5 name their types the same way, apart from Search
 * Box's `street`, so one table scores both.
 */
const PRECISION: Record<string, number> = {
  poi: 0,
  address: 1,
  street: 2,
  neighborhood: NEIGHBORHOOD_PRECISION,
  locality: 4,
  place: PLACE_PRECISION,
  postcode: 6,
  district: 7,
  region: 8,
  country: 9,
};

/** Unrecognised types rank with `place`: specific enough to keep, not to lead. */
const DEFAULT_PRECISION = PLACE_PRECISION;

/**
 * Where a destination stops and an administrative area begins.
 *
 * `place` (a city) is on the destination side deliberately. "Chennai" is a
 * perfectly good answer to "where are you going", and demoting it would put a
 * shop called "Chennai Silks" above the city itself.
 */
const BROADEST_DESTINATION = PLACE_PRECISION;

/** Feature type → precision. Unknown and absent types both take the default. */
export function featurePrecision(featureType?: string): number {
  if (!featureType) return DEFAULT_PRECISION;
  return PRECISION[featureType] ?? DEFAULT_PRECISION;
}

/**
 * Is this a place, or the region it happens to sit in?
 *
 * The only precision distinction allowed to override distance. A postcode, a
 * district, a state or a country is never what somebody typing into a
 * destination field meant, however exactly its name matches and however near
 * its centroid falls — so it sorts below every real destination rather than
 * competing with them.
 */
function isBroadArea(precision: number): number {
  return precision > BROADEST_DESTINATION ? 1 : 0;
}

/**
 * How well a result's own name answers what was typed.
 *
 * Distance cannot be the primary key on its own. Searching "fortune tower" from
 * Velachery, Mapbox returns P.R.P. Tower, Temple Tower and Vvr Towers — all
 * within a couple of kilometres, all scoring 0.50 on the word "tower" alone.
 * Sorting by distance first puts those three above every real Fortune Tower,
 * which is the bug the earlier relevance-first ranking existed to prevent.
 *
 * So name strength tiers first and distance orders *within* a tier. A result
 * that genuinely matches what was typed always outranks one that merely happens
 * to be nearby, and among genuine matches the nearest wins — which is what
 * "nearby first" actually means.
 *
 *   0  the name is exactly the query
 *   1  the name starts with the query
 *   2  the name contains every word typed
 *   3  everything else — a partial-word match
 */
export function nameStrength(query: string, name: string): number {
  const q = query.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (!q) return 3;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;

  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 0 && words.every((w) => n.includes(w))) return 2;
  return 3;
}

/**
 * Distance bands, so ranking is not decided by trivial differences.
 *
 * Within a band the more relevant result wins; across bands the nearer one
 * does. Without banding, two equally-good matches 4.0km and 4.2km away would be
 * ordered by 200 metres rather than by which one Mapbox thinks you meant.
 */
export function distanceBand(km: number): number {
  if (km < 5) return 0;
  if (km < 15) return 1;
  if (km < 50) return 2;
  if (km < 150) return 3;
  if (km < 500) return 4;
  return 5;
}

/**
 * Drops the area a searcher tacked onto the end of what they were looking for.
 *
 * People type "Sardar Patel Road Chennai". Matched literally, that road fails
 * every tier — its own name has no "Chennai" in it — and so does everything
 * else, which leaves the list sorted by distance alone and led by an Airtel
 * store 148 metres away with "ROAD" and "CHENNAI" in its name. Against the same
 * road with "Chennai" trimmed off, it is an exact match and leads.
 *
 * Three things keep it narrow enough to be safe.
 *
 * Only *trailing* words go, so the query keeps its head. The word has to be
 * absent from the candidate's own name, so a road actually called "… Road" does
 * not lose the word "road". And it has to equal a *whole* part of the address
 * line rather than merely appear somewhere in it — "Chennai" is a part of
 * "Anna University, Chennai, Tamil Nadu" and is trimmed, while "Nagar" is only
 * half of "Anna Nagar" and is not, which is what stops a two-word area name
 * from being whittled down to one word that matches half the city.
 *
 * Between them those keep it off the case it would otherwise ruin: searching
 * "Chennai Central", the trailing word is "Central", which is nobody's city, so
 * nothing is trimmed and a "Central Excise" office four kilometres away stays
 * the non-answer it is.
 */
export function trimTrailingArea(query: string, place: RankablePlace): string {
  if (!place.address) return query;

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const name = place.name.toLowerCase();
  const areas = new Set(
    place.address
      .toLowerCase()
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean),
  );

  let end = words.length;
  while (end > 1) {
    const word = words[end - 1];
    if (!word || name.includes(word) || !areas.has(word)) break;
    end -= 1;
  }

  return end === words.length ? query : words.slice(0, end).join(' ');
}

/**
 * Did the searcher type the exact name of an area?
 *
 * "Chennai" is a city, and someone typing it means the city. But Mapbox's POI
 * table has several entries *called* "Chennai" — a shop on Velachery Main Road
 * among them — and they are nearer than the city's centroid, so on distance
 * they lead and the city itself lands third. Nobody searching a city wants a
 * shop named after it.
 *
 * Deliberately narrow. It needs the whole query to be the area's whole name, so
 * it cannot fire on "Chennai Central" or on a building that merely sits in
 * Chennai. And it covers only the areas that are also destinations — a district
 * or a postcode called "Chennai" is not what anyone meant either, so those stay
 * below the POIs rather than being promoted alongside the city.
 */
function isNamedArea(query: string, place: RankablePlace): number {
  const isArea =
    place.precision >= NEIGHBORHOOD_PRECISION && place.precision <= BROADEST_DESTINATION;
  return isArea && nameStrength(query, place.name) === 0 ? 0 : 1;
}

/**
 * Is this a real answer to the query, or just something with a word in common?
 *
 * The only distinction that may override distance. Grading the genuine matches
 * against each other *before* distance was measurably wrong: searching "fortune
 * tower", an exact "Fortune Tower" 1,175km away outranked "Fortune Towers"
 * 8km away purely because the plural scored a weaker name tier. Both are
 * plainly the thing being searched for, so distance should decide between them
 * — which is the whole complaint.
 *
 * Tier 3 stays separated, because "Temple Tower" 1.2km away is *not* a Fortune
 * Tower and must never lead the list however close it is.
 */
function isGenuineMatch(query: string, name: string): number {
  return nameStrength(query, name) <= 2 ? 0 : 1;
}

/**
 * Comparator: a real answer first, a real *place* second, nearest third.
 *
 * The two precision keys are deliberately placed either side of distance rather
 * than above it. Precision-first would rank a POI over the city with the same
 * name — searching "Chennai" would lead with "Chennai Central" — and
 * precision-last would leave a state's centroid competing with buildings on the
 * strength of being closer than they are. So the coarse question ("is this a
 * destination or an administrative area?") outranks distance, and the fine one
 * ("of two equally good, equally near matches, which is the more exact kind of
 * thing?") settles what distance and name could not.
 *
 * Exactness of the name is *not* promoted above distance, and that is the whole
 * point of the ordering. It was tried: searching "Fortune Tower", an exact
 * "Fortune Tower" 1,175km away outranked "Fortune Towers" 8km away purely
 * because the plural scored a weaker tier. Both are plainly the thing being
 * searched for, so distance decides between them — which is the original
 * complaint. `isNamedArea` is the one exception, and it is narrow enough to
 * only fire when the query *is* an area's whole name.
 */
export function comparePlaces<T extends RankablePlace>(query: string) {
  return (a: T, b: T): number => {
    // Each candidate is matched against the query minus whatever trailing area
    // name belongs to *it* — so "Sardar Patel Road Chennai" is read as the road
    // by the road, and as typed by everything else.
    const qa = trimTrailingArea(query, a);
    const qb = trimTrailingArea(query, b);

    // 1. Did the searcher name an area outright? Then they meant that area.
    const named = isNamedArea(qa, a) - isNamedArea(qb, b);
    if (named !== 0) return named;

    // 2. Does it actually answer the query at all?
    const genuine = isGenuineMatch(qa, a.name) - isGenuineMatch(qb, b.name);
    if (genuine !== 0) return genuine;

    // 3. Is it a place you can go to, or the area around one?
    const broad = isBroadArea(a.precision) - isBroadArea(b.precision);
    if (broad !== 0) return broad;

    // 4. Among real answers, how far away is it? This is the primary key.
    const band = distanceBand(a.distanceKm) - distanceBand(b.distanceKm);
    if (band !== 0) return band;

    // 5. Equally near: prefer the closer name match,
    const strength = nameStrength(qa, a.name) - nameStrength(qb, b.name);
    if (strength !== 0) return strength;

    // 6. then the more precise kind of feature — the building over the street
    //    it stands on, the street over the neighbourhood it runs through,
    const precision = a.precision - b.precision;
    if (precision !== 0) return precision;

    // 7. then Mapbox's own confidence,
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;

    // 8. and exact distance is the final, stable tiebreak.
    return a.distanceKm - b.distanceKm;
  };
}
