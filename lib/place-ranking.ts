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

  /**
   * Tier 2 asks the same question `queryCoverage` does — does the name contain
   * every word typed — so it asks it through the same predicate. It used to test
   * raw `includes` on the whole string, which disagreed with coverage in both
   * directions: it counted "city" as present in "electricity", and it refused to
   * see "marketcity" in "Market City". The second is what made this tier the
   * place the fix had to go. Tier 2 is key 3 in the comparator and coverage is
   * key 7, so a mall written with a space had already lost four keys earlier —
   * it was sorted below the shops inside it before its coverage was ever read.
   *
   * Tiers 0 and 1 are untouched: an exact name and a name that opens with the
   * query are string facts, and neither needs a notion of words at all.
   */
  const wanted = tokens(q);
  if (wanted.length === 0) return 3;
  return coveredWords(wanted, tokens(n)).every(Boolean) ? 2 : 3;
}

/** Lowercased word tokens, with punctuation dropped. "T. Nagar" → ["t","nagar"]. */
function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Does one query word appear at the head of a name token, or across a run of
 * consecutive ones?
 *
 * The run is the concatenation case: "marketcity" against "Phoenix Market City
 * Mall", where the word the user typed as one is written in the data as two.
 * People type venue names both ways and Mapbox stores them both ways, so a
 * matcher that only compares token to token reports two spellings of the same
 * mall as unrelated places.
 *
 * Two things keep the joining from matching everything. Tokens are only ever
 * joined *consecutively*, so the words have to appear together and in order —
 * "city market" cannot answer "marketcity". And the run stops growing as soon as
 * it is at least as long as the word being looked for, so a two-letter query word
 * can never be satisfied by welding an entire name together.
 */
function matchesToken(word: string, have: string[]): boolean {
  // The ordinary case, unchanged and tried first.
  if (have.some((token) => token.startsWith(word))) return true;

  for (let start = 0; start < have.length; start += 1) {
    let joined = '';
    for (let i = start; i < have.length && joined.length < word.length; i += 1) {
      joined += have[i] ?? '';
      // `i > start` because a single token is the case above; this is only for
      // runs that genuinely span a space.
      if (i > start && joined.startsWith(word)) return true;
    }
  }

  return false;
}

/**
 * Which of the query's words the name answers.
 *
 * Shared by `queryCoverage` and `isContainedVenue` so the two can never disagree
 * about whether a name says what was typed — one deciding a mall matches while
 * the other decides it does not would be a ranking that contradicts itself.
 *
 * The joined *pair* is tried before the single word, and the order matters. It is
 * the mirror of the run in `matchesToken`: "Phoenix Market City" against "Phoenix
 * Marketcity", where the user typed two words for the data's one. Tried second,
 * "market" would match "marketcity" on its own and leave "city" behind as an
 * unmatched word, scoring the right venue at two thirds. Tried first, the pair
 * consumes both and the venue scores full marks.
 */
function coveredWords(wanted: string[], have: string[]): boolean[] {
  const covered = new Array<boolean>(wanted.length).fill(false);

  for (let i = 0; i < wanted.length; i += 1) {
    const word = wanted[i];
    if (!word) continue;

    const next = wanted[i + 1];
    if (next && have.some((token) => token.startsWith(word + next))) {
      covered[i] = true;
      covered[i + 1] = true;
      // Both are spoken for; the next word must not be counted again.
      i += 1;
      continue;
    }

    if (matchesToken(word, have)) covered[i] = true;
  }

  return covered;
}

/**
 * How much of the query a name actually answers, 0 to 1.
 *
 * `nameStrength` cannot express this, and that is the bug it caused: its tier 2
 * is `every word is present`, so a name matching three words of four scores
 * exactly the same as one matching none. Searching "IIT Madras Gate 1", the
 * correct answer — "IIT MADRAS MAIN GATE (IN)" — has no "1" in it, landed in the
 * bottom tier alongside genuine rubbish, and the picker told the user nothing
 * matched closely while displaying it first.
 *
 * Word-start matching rather than substring, because substring is what makes
 * short tokens meaningless: "a" is inside almost every name ever written, and
 * counting that as a match would push every list back over the confidence line.
 */
export function queryCoverage(query: string, name: string): number {
  const wanted = tokens(query);
  if (wanted.length === 0) return 0;

  const covered = coveredWords(wanted, tokens(name));

  /**
   * Weighted by length, not counted.
   *
   * Counting words makes every token equally informative, and they are not:
   * against "1 Bazullah Road T Nagar", a record matching "road" and "nagar"
   * scores the same two-of-four as one matching "bazullah" and "road", so an
   * unrelated building on a road in some nagar tied with the actual street. The
   * long, rare word is the one carrying the address; "t" is carrying nothing.
   */
  let total = 0;
  let matched = 0;
  for (const [index, word] of wanted.entries()) {
    total += word.length;
    if (covered[index]) matched += word.length;
  }

  return total === 0 ? 0 : matched / total;
}

/**
 * Below this share of the query matched, a result is not really an answer.
 *
 * 0.6 sits between the two measured cases it has to separate: "IIT Madras Gate 1"
 * against "IIT MADRAS MAIN GATE (IN)" scores 0.75, and the nonsense query
 * "zzzqqq not a real place at all" tops out at 0.43 against the ten POIs it
 * returns because "place" and "all" are words.
 */
const STRONG_COVERAGE = 0.6;

/**
 * The house number a query opens with, if it opens with one.
 *
 * Leading position is the whole test, and it is what keeps this off "IIT Madras
 * Gate 1". People type addresses number-first — "14 Bazullah Road" — and type
 * ordinal names number-last — "Gate 1", "Terminal 2", "Phase 3". Reading the
 * trailing number as a house number would make every campus gate an address
 * search and hand the "no house number matched" warning to queries that were
 * never addresses.
 *
 * "1st" and "1BHK" are deliberately not house numbers: a house number is digits,
 * optionally with a single letter suffix — 12A, 4B.
 */
export function houseNumber(query: string): string | null {
  const first = tokens(query)[0];
  if (!first) return null;
  return /^\d{1,5}[a-z]?$/.test(first) ? first : null;
}

/** Does a name carry this house number as a token of its own? */
function hasHouseNumber(name: string, number: string): boolean {
  return tokens(name).includes(number);
}

/** How well a name matches the query with the house number taken out of it. */
function addressCoverage(query: string, name: string): number {
  const number = houseNumber(query);
  const rest = tokens(query)
    .filter((token) => token !== number)
    .join(' ');
  return queryCoverage(rest, name);
}

/**
 * Does the name answer the query's house number?
 *
 * 0 when it does, 1 for everything else — and 1 for everything when the query has
 * no house number, which makes this key inert for almost every search.
 *
 * The number is looked for *anywhere* in the name while only being read from the
 * *front* of the query, and the asymmetry is deliberate. Mapbox's Indian address
 * features put it last — the real "1 Bazullah Road" comes back as "Bazullah Road
 * 1" — so a leading-position test on both sides would miss the exact match it
 * exists to find.
 *
 * Only two levels, not three. Demoting a wrong house number below everything else
 * would put a fruit shop on a different road above number 14 on the right one,
 * and 14 is a better answer than that. What matters is that it cannot beat an
 * exact match, and two levels is the whole of what that needs.
 */
function houseNumberRank(query: string, name: string): number {
  const number = houseNumber(query);
  if (!number) return 1;
  if (!hasHouseNumber(name, number)) return 1;

  /**
   * The number alone is not enough, and testing it alone was measurably worse
   * than not testing it at all. "1" is a token in a great many names — a POI
   * actually called "1", and "DATAISM 1/2 VENKATESWARA NAGAR 1ST NAIN ROAD" —
   * so promoting everything containing it put two of those above the address
   * that was asked for.
   *
   * A house number only means anything attached to a street, so the rest of the
   * address has to match too. `addressCoverage` is length-weighted, which is what
   * separates matching "bazullah" from matching "road" and "nagar".
   */
  return addressCoverage(query, name) >= STRONG_COVERAGE ? 0 : 1;
}

/**
 * Is this the place that was asked for, or a business inside it?
 *
 * Searching "Phoenix Marketcity Chennai" returns the mall and then Mokobara, The
 * Souled Store, Club Sulaimani, Peora and Crossword — every one of which contains
 * the whole query, because every tenant in an Indian mall names itself after the
 * mall. On name and distance they are indistinguishable from the mall itself, so
 * they filled five of the first six rows of a destination picker.
 *
 * The signal is structural rather than semantic, and it is the one thing that
 * separates the two cases reliably: a business inside a venue puts *its own* name
 * first and the venue's name after it, while a part of a venue puts the venue's
 * name first — "IIT Madras Main Gate", "Chennai Central Suburban Terminal". So a
 * candidate is treated as contained when it repeats the entire query but does not
 * *begin* with any word of it.
 *
 * Generic by construction: it never mentions a mall, and it does the same job for
 * campuses (SAC IIT Madras), stations, airports, hospitals and hotels. It costs
 * nothing on a query that no candidate fully contains, which is most of them.
 */
function isContainedVenue(query: string, name: string): number {
  const wanted = tokens(query);
  const have = tokens(name);
  if (wanted.length === 0 || have.length === 0) return 0;

  // Only fires when the candidate really does name the queried venue in full.
  // Shares `coveredWords` with `queryCoverage`, so a mall written "Market City"
  // is recognised as the queried venue by both or by neither.
  if (!coveredWords(wanted, have).every(Boolean)) return 0;

  const head = have[0];
  if (!head) return 1;

  /**
   * Its own name first, the venue's name after it: a tenant, not the venue.
   *
   * The second direction covers a query typed as one word — "phoenixmarketcity"
   * against a name beginning "Phoenix" — where the head is a *part* of the query
   * word rather than the other way round. Guarded on length so a name starting
   * with "a" or "I" cannot escape the rule on the strength of one letter.
   */
  const namesTheVenueFirst = wanted.some(
    (word) => head.startsWith(word) || (head.length >= 3 && word.startsWith(head)),
  );
  return namesTheVenueFirst ? 0 : 1;
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
 * Near, in the region, or somewhere else entirely.
 *
 * A three-way coarsening of `distanceBand`, and it exists to fix a cliff. The
 * bands are fine enough that two results a few hundred metres apart can fall
 * either side of an edge, and because the band key outranked containment, that
 * edge decided things containment should have. Searching "FORTUNE TOWER" from
 * Chennai:
 *
 *   CeeDeeYes Fortune Towers  4.5km  band 0 ┐ different bands, so the shop
 *   Fortune Towers            5.5km  band 1 ┘ inside the tower led the list
 *
 * Two hundred metres either side of 5 km flipped it. The tier is deliberately
 * much coarser: both of those are simply "local", so the question of which is
 * the venue and which is a business inside it gets asked before distance is
 * consulted at all.
 *
 * Derived from `distanceBand` rather than carrying its own numbers, so there is
 * one distance ladder in this file and the tiers are its rungs grouped up:
 *
 *   0  local     under 50km   — the same city and its outskirts
 *   1  regional  under 500km  — a few hours away
 *   2  distant   beyond that  — another part of the country
 *
 * Coarse on purpose, and no coarser than it has to be. Making everything one
 * tier would let a venue in another state outrank a genuinely useful local
 * result, which is the exact complaint the distance keys were written for.
 */
const REGIONAL_BAND = 3;
const DISTANT_BAND = 5;

export function localityTier(km: number): number {
  const band = distanceBand(km);
  if (band < REGIONAL_BAND) return 0;
  if (band < DISTANT_BAND) return 1;
  return 2;
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

/** Every whole address part any candidate mentioned, lowercased. */
function areasMentioned(candidates: RankablePlace[]): Set<string> {
  const areas = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate.address) continue;
    for (const part of candidate.address.toLowerCase().split(',')) {
      const value = part.trim();
      if (value) areas.add(value);
    }
  }
  return areas;
}

/**
 * The same query with a trailing area name taken off, when the results show one
 * is there.
 *
 * `trimTrailingArea` can only reorder results that came back. This decides
 * whether the search is worth *asking again* without the area, and it exists
 * because of one measured failure: "Phoenix Marketcity Chennai" returns ten
 * shops inside the mall — Mokobara, The Souled Store, Peora — and not the mall
 * itself, because every tenant has "Chennai" in its name and the mall does not.
 * Asked as "Phoenix Marketcity", the same index returns the mall first. No
 * ranking can promote a feature Mapbox never sent, so the query has to be asked
 * twice.
 *
 * Deliberately *not* `trimTrailingArea` reused, which was the first attempt and
 * was wrong on precisely this case. That function refuses to trim a word the
 * candidate's own name contains, so that a road called "… Road" cannot lose the
 * word "road" — and here every candidate's name contains "Chennai", so nothing
 * was ever trimmed and the mall was never asked for. The guard is right for
 * ranking one candidate and wrong for choosing a query: a shop called
 * "… Chennai" standing in Chennai is still evidence that "Chennai" is the area,
 * not the place.
 *
 * What it keeps is the part that makes trimming safe. Only *trailing* words go,
 * so the query keeps its head; at least one word always survives; and a word has
 * to equal a *whole* address part rather than merely appear in one, which is what
 * stops "Anna Nagar" being whittled down to "Anna" on the strength of "Nagar"
 * being half of an area name.
 *
 * Null when no trailing word names an area — the common case, and it costs no
 * extra request.
 */
export function broadenQuery(query: string, candidates: RankablePlace[]): string | null {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const areas = areasMentioned(candidates);

  let end = words.length;
  while (end > 1 && areas.has(words[end - 1] ?? '')) end -= 1;

  return end === words.length ? null : words.slice(0, end).join(' ');
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
 * Did anything actually answer the query, or is this a list of near-misses?
 *
 * A geocoder does not return nothing. Searching "zzzqqq not a real place at all"
 * from Chennai returns ten POIs — "Medugo - All your Medical Reports in One
 * Place", "Premium 2BHK Comfort for All - Entire Place", an estate agent 254 km
 * away — because "place" and "all" are words and every result contains one. The
 * empty state never fires, so the user is handed a full, confident-looking list
 * in which nothing is what they asked for.
 *
 * Measured on `queryCoverage`, not on `nameStrength`, and that is a correction
 * rather than a refinement. Keying on the tiers meant a name had to contain
 * *every* word typed to count as an answer, so "IIT Madras Gate 1" was declared
 * to match nothing while displaying "IIT MADRAS MAIN GATE (IN)" at the top of the
 * list — a warning that contradicted the result immediately beneath it, and read
 * as the app having failed when it had in fact succeeded.
 *
 * It never hides results — one of them may still be the nearest thing there is —
 * it only earns the sentence that says so.
 */
export function everyMatchIsWeak(query: string, candidates: RankablePlace[]): boolean {
  if (candidates.length === 0) return false;

  /**
   * An address whose number is nowhere in the results is its own kind of doubt,
   * and worth saying out loud: for a car being sent somewhere, "we found the
   * street but not the number" is exactly the case where a confident-looking list
   * is dangerous. Only fires for queries that opened with a house number.
   */
  const number = houseNumber(query);
  if (number && !candidates.some((candidate) => hasHouseNumber(candidate.name, number))) {
    return true;
  }

  return candidates.every(
    (candidate) =>
      queryCoverage(trimTrailingArea(query, candidate), candidate.name) < STRONG_COVERAGE,
  );
}

/**
 * Does every result look like a business *inside* the place that was asked for?
 *
 * The evidence that a search failed to retrieve the venue itself. Searching
 * "Phoenix Market City" returns ten features and the mall is not among them —
 * Punjab Grill, Pizza Hut, Toscano, Tovo, Soch, all of them inside it, all of
 * them naming it. Every result being a tenant is a strong statement that the
 * venue exists, that the user asked for it, and that the provider did not send
 * it. That is the only circumstance in which asking again is worth a request.
 *
 * Reuses `isContainedVenue`, so this and the ranking can never disagree about
 * what "inside" means.
 */
export function everyResultIsContained(query: string, candidates: RankablePlace[]): boolean {
  if (candidates.length === 0) return false;
  return candidates.every((candidate) => isContainedVenue(query, candidate.name) === 1);
}

/**
 * Does this name answer the query as the venue itself, rather than as something
 * inside it?
 *
 * Used to decide what a recovery request is allowed to contribute. A second
 * query is a guess at a spelling, and a guess that misses would otherwise pour
 * unrelated places into a list that was merely incomplete — so only a result that
 * names the queried venue in full *and* leads with it is kept, and everything
 * else the recovery turns up is discarded.
 */
export function namesTheQueriedVenue(query: string, name: string): boolean {
  const wanted = tokens(query);
  if (wanted.length === 0) return false;
  if (!coveredWords(wanted, tokens(name)).every(Boolean)) return false;
  return isContainedVenue(query, name) === 0;
}

/**
 * The query with its last two words run together, or null when that is not a
 * sensible thing to ask.
 *
 * Providers index some venue names concatenated — "Phoenix Marketcity",
 * "Greenpark", "Suncity" — and retrieval is not tolerant of the difference the
 * way our own matching now is. Typing the words apart returns the businesses
 * inside the venue and not the venue, because those are spelled the way they were
 * typed. Asking again with the words joined finds it.
 *
 * The *last* pair, and only that pair, because the budget is one request. A
 * three-word query has two adjacent pairs and there is no way to try both; the
 * tail is where the distinguishing part of a venue name sits — "Market City",
 * "Green Park", "Sun City" — while the head is usually the brand, which providers
 * spell the same either way. Measured: joining everything into one token is not
 * an option at all, "phoenixmarketcity" returns nothing.
 *
 * Null for an address. A house number must never be welded to a street name, and
 * an address that did not resolve is not a venue that failed to retrieve.
 */
export function concatenatedQuery(query: string): string | null {
  if (houseNumber(query)) return null;

  const words = tokens(query);
  if (words.length < 2) return null;

  const last = words[words.length - 1] ?? '';
  const penultimate = words[words.length - 2] ?? '';
  const joined = [...words.slice(0, -2), `${penultimate}${last}`].join(' ');

  return joined === words.join(' ') ? null : joined;
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
 *
 * The keys added since are placed by the same rule. A house number is not a shade
 * of relevance but a different building, so it sits at the top with
 * `isNamedArea`. Containment only ever separates a venue from the shops inside
 * it, which are by definition in the same place — so it sits between the two
 * halves of the distance question: below `localityTier`, which keeps a distant
 * venue from beating a local anything, and above `distanceBand`, whose edges are
 * fine enough to fall between a tower and a shop in its lobby and were doing
 * exactly that.
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

    /**
     * 2. Did they give a house number? Then that number is the question.
     *
     * Above `isGenuineMatch` on purpose, which is the whole fix. Searching
     * "1 Bazullah Road T Nagar", the wrong building — "14 Bazullah Road, T Nagar"
     * — contains all five words typed, because "1" is a substring of "14", and so
     * counted as a genuine match. The right one, which Mapbox formats as
     * "Bazullah Road 1", has no standalone "t" and counted as a near-miss. The
     * wrong house number therefore won two keys before distance was consulted.
     * Sending a car to the wrong number on the right road is not a near miss.
     */
    const house = houseNumberRank(qa, a.name) - houseNumberRank(qb, b.name);
    if (house !== 0) return house;

    // 3. Does it actually answer the query at all?
    const genuine = isGenuineMatch(qa, a.name) - isGenuineMatch(qb, b.name);
    if (genuine !== 0) return genuine;

    // 4. Is it a place you can go to, or the area around one?
    const broad = isBroadArea(a.precision) - isBroadArea(b.precision);
    if (broad !== 0) return broad;

    /**
     * 5. Is it near, in the region, or somewhere else entirely?
     *
     * The coarse half of the distance question, and it is above containment
     * because the Fortune Tower lesson still holds: among things that genuinely
     * match, the near one wins. A venue a thousand kilometres away must never
     * beat a useful local result, whatever the local result turns out to be.
     */
    const locality = localityTier(a.distanceKm) - localityTier(b.distanceKm);
    if (locality !== 0) return locality;

    /**
     * 6. Is it the venue that was asked for, or a shop inside it?
     *
     * Now above the fine distance bands rather than below them, which is the fix
     * for the reported case. A mall and its tenants are the same place to within
     * a couple of hundred metres, so letting a band edge fall between them and
     * decide was an accident of arithmetic — 4.5km and 5.5km are the same answer
     * to "where", and differ only in which of them is the actual venue.
     *
     * Safe here precisely because `localityTier` sits above it: this can only
     * ever reorder two results that are already in the same part of the world.
     */
    const contained = isContainedVenue(qa, a.name) - isContainedVenue(qb, b.name);
    if (contained !== 0) return contained;

    /**
     * 7. Among things in the same part of the world, how far away is it?
     *
     * Still the key that decides most searches; it has simply stopped deciding
     * the one question it was never able to answer.
     */
    const band = distanceBand(a.distanceKm) - distanceBand(b.distanceKm);
    if (band !== 0) return band;

    /**
     * 8. How much of what was typed does the name actually account for?
     *
     * Below containment, and it has to be: a candidate missing a word is a tier-3
     * near-miss and has already lost on key 3, so this only ever compares things
     * that are all genuine matches, or all equally partial ones.
     *
     * It is the second half of the "IIT Madras Gate 1" fix. With only the tiers,
     * every candidate for that query scored 3 — none contains "1" — and the list
     * fell through to raw distance, which put a canteen 300 m away above the gate
     * that was asked for. Three words of four beats two of four.
     */
    const coverage = queryCoverage(qb, b.name) - queryCoverage(qa, a.name);
    if (coverage !== 0) return coverage;

    // 9. Equally near: prefer the closer name match,
    const strength = nameStrength(qa, a.name) - nameStrength(qb, b.name);
    if (strength !== 0) return strength;

    // 10. then the more precise kind of feature — the building over the street
    //     it stands on, the street over the neighbourhood it runs through,
    const precision = a.precision - b.precision;
    if (precision !== 0) return precision;

    // 11. then Mapbox's own confidence,
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;

    // 12. and exact distance is the final, stable tiebreak.
    return a.distanceKm - b.distanceKm;
  };
}
