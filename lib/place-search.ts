/**
 * How many requests a search costs, and what is done with the answers.
 *
 * Lifted out of the picker so the part with a right and a wrong answer can be
 * run without a browser, a token or a network — the same reason `place-ranking`
 * and `place-feature` live apart. What is testable here is not the ranking, which
 * has its own module, but the decisions *around* it: how many times the provider
 * is asked, what the second question is, which of its answers are allowed to
 * count, and what happens when the user types another character mid-flight.
 *
 * The provider arrives as an argument rather than being imported. That is what
 * lets a test hand it a fixed set of features and count the calls, and it keeps
 * this module free of Mapbox, of URLs and of the public token.
 *
 * Imports are relative and carry their extension because `node --test` strips
 * types rather than compiling, so it resolves specifiers itself and knows nothing
 * about the `@/*` paths.
 */

import {
  broadenQuery,
  comparePlaces,
  concatenatedQuery,
  everyResultIsContained,
  namesTheQueriedVenue,
  type RankablePlace,
} from './place-ranking.ts';
import { dedupePlaces } from './place-dedupe.ts';

/** Everything the pipeline needs of a result, whoever produced it. */
export interface SearchCandidate extends RankablePlace {
  id: string;
  center: [number, number];
}

/**
 * One provider request. `bounded` asks for the local pass — proximity only biases
 * a provider, so a box is the only way to insist.
 */
export type PlaceFetcher<T extends SearchCandidate> = (
  query: string,
  bounded: boolean,
  signal?: AbortSignal,
) => Promise<T[]>;

/**
 * Thrown when every request for a query failed.
 *
 * A distinct type because the picker has to tell three things apart that used to
 * look identical: results, no results, and no answer. Returning `[]` on a 401
 * meant a rate-limited token, an expired token, a flight-mode phone and a
 * genuinely unknown building all rendered as the same silent empty list — so the
 * one state where retrying is the right advice was the one state the user could
 * not see.
 */
export class SearchFailed extends Error {
  constructor(cause?: unknown) {
    super('Place search failed');
    this.name = 'SearchFailed';
    this.cause = cause;
  }
}

/** As many rows as a list can be scrolled through before it stops helping. */
const MAX_RESULTS = 12;

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * The one follow-up question, chosen from what the first two answers showed.
 *
 * There is a single slot, deliberately. Both of the reasons to ask again are
 * conditional on evidence, and letting them stack would mean four requests for
 * one keystroke's worth of typing.
 *
 * Broadening wins the slot when both apply, because it is the stronger move: it
 * removes an area name the *results themselves* proved was an area, where recovery
 * guesses at a spelling. Measured on "Phoenix Marketcity Chennai", where both
 * trigger — broadening asks "phoenix marketcity" and finds the mall, while
 * concatenating the broadened form would ask "phoenixmarketcity", which returns
 * nothing at all.
 */
export interface FollowUp {
  query: string;
  /** Which move claimed the slot. Decides what its answers may contribute. */
  kind: 'broadened' | 'recovery';
}

export function followUpQuery(query: string, candidates: RankablePlace[]): FollowUp | null {
  // 1. Did the results show the query ended in an area name? Drop it and re-ask.
  const broadened = broadenQuery(query, candidates);
  if (broadened) return { query: broadened, kind: 'broadened' };

  // 2. Was every single result a business inside the place being asked for? Then
  //    the venue exists and was not returned, and a spelling is worth one guess.
  if (!everyResultIsContained(query, candidates)) return null;

  const concatenated = concatenatedQuery(query);
  return concatenated ? { query: concatenated, kind: 'recovery' } : null;
}

/**
 * Two passes, then at most one more, merged, ranked and deduplicated.
 *
 * The two base passes run together and are both sources of candidates. The
 * bounded one earns its place because proximity only *biases* a provider, so
 * without a box a well-known distant match can bury a local one. It is never a
 * gate on the other — an earlier version returned early whenever the bounded pass
 * was non-empty, which hid all four genuine Fortune Towers behind five wrong
 * buildings that happened to be closer.
 */
export async function searchPlaces<T extends SearchCandidate>(
  query: string,
  fetchPlaces: PlaceFetcher<T>,
  options: { verified?: T[] } = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const merged = new Map<string, T>();
  const absorb = (items: T[]) => {
    for (const item of items) {
      const existing = merged.get(item.id);
      // The same feature can arrive from more than one pass; keep the
      // better-scored copy.
      if (!existing || item.relevance > existing.relevance) merged.set(item.id, item);
    }
  };

  // Spllit's own verified pickup points join the same candidate list and go
  // through the same comparator as everything else — see `content/pickup-points`.
  absorb(options.verified ?? []);

  /**
   * `allSettled`, not `all`.
   *
   * One pass failing while the other answers is a worse list, not a broken
   * search, and throwing the good half away would be a regression on the very
   * flakiness this is meant to survive. Only a total failure is an error.
   */
  const settled = await Promise.allSettled([
    fetchPlaces(query, true, signal),
    fetchPlaces(query, false, signal),
  ]);

  const answered = settled.filter(
    (result): result is PromiseFulfilledResult<T[]> => result.status === 'fulfilled',
  );

  if (answered.length === 0) {
    // Abort is not a failure — it means the user typed another character. Let it
    // propagate as itself so the caller treats the query as cancelled.
    const reason = settled.find((result) => result.status === 'rejected')?.reason;
    if (isAbort(reason)) throw reason;
    // A verified match survives a provider outage: it did not come from there.
    if (merged.size === 0) throw new SearchFailed(reason);
  }

  for (const result of answered) absorb(result.value);

  const followUp = followUpQuery(query, [...merged.values()]);
  if (followUp) {
    try {
      const answers = await fetchPlaces(followUp.query, true, signal);
      /**
       * A follow-up may only contribute what it was sent for.
       *
       * Broadening is safe to absorb whole — it is the same search with a city
       * name taken off. Recovery is a guess at a spelling, and a guess that
       * missed would otherwise pour unrelated places into a list that was merely
       * incomplete. So when the slot was used for recovery, only results that
       * name the queried venue in full *and* lead with it are kept, and a
       * recovery that finds nothing of the sort silently changes nothing.
       */
      absorb(
        followUp.kind === 'recovery'
          ? answers.filter((candidate) => namesTheQueriedVenue(query, candidate.name))
          : answers,
      );
    } catch (error) {
      // The first two passes have already produced a usable list; losing it to a
      // flaky extra request would be absurd. An abort still propagates.
      if (isAbort(error)) throw error;
    }
  }

  // Ranked first, then deduplicated, so the copy that survives each duplicate
  // pair is the one the comparator put highest.
  return dedupePlaces([...merged.values()].sort(comparePlaces<T>(query))).slice(0, MAX_RESULTS);
}
