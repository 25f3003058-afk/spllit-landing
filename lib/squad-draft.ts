import type { PickedPlace } from '@/components/shared/place-picker';
// Relative, with extensions: this module's round trip is checked under
// `node --test`, which resolves specifiers itself and knows nothing about the
// `@/*` paths. Both of these import only types, so nothing else follows them in.
import { readTripSearch, tripSearchParams } from './trip-search.ts';
import { SQUAD_PURPOSES } from './squad-purpose.ts';
import { isGeoSource } from './pickup-advice.ts';
import { featurePrecision } from './place-ranking.ts';
import type { LngLat, SquadType } from '@/types';

/**
 * A squad being created, encoded in the URL.
 *
 * This exists because choosing a meeting point on the map is a *different
 * screen*. The create form kept every answer in `useState`, so leaving the
 * route to point at a map would have thrown away the destination, the purpose,
 * the departure and the capacity — the user would come back to an empty form
 * holding one pin. Putting the draft in the query string means the round trip
 * is lossless, and, as with `trip-search`, that a refresh or the Back button
 * reproduces the same half-filled form.
 *
 * The same rule as `trip-search` applies to what may live here: a URL is
 * copied, logged by proxies and pasted into chats, so it carries only values
 * that are already public. Place names and coordinates qualify — they are
 * printed on the squad card that strangers browse. The squad name qualifies for
 * the same reason. Nothing private, nothing about payment, no identifiers.
 *
 * Destination and meeting point are deliberately written by two disjoint sets
 * of parameters, and the destination pair is written only by `tripSearchParams`
 * — one function, shared with the planner. A meeting point can therefore never
 * land in `destLat`/`destLng`/`dest` by accident, which is the one mistake this
 * flow must not make: they answer completely different questions.
 *
 *   destination   — where the squad is going       (dest, destLng, destLat)
 *   meeting point — where its members regroup      (meetingPlace, meetingLng,
 *                                                   meetingLat, meetingAddress)
 */
export type SquadVisibility = 'public' | 'invite';

/**
 * Capacities offered by the create flow, including the leader.
 *
 * Lives here rather than in the page because the draft has to validate what
 * comes back out of the URL against it — two copies of this ladder would
 * eventually disagree, and the disagreement would only show up as a form that
 * silently drops a capacity somebody had picked.
 */
export const SQUAD_CAPACITIES = [2, 3, 4, 5, 6, 8, 10] as const;

/** Long enough for any real squad name, short enough to keep the URL sane. */
const MAX_NAME = 80;

export interface SquadDraft {
  /**
   * Where the trip starts, when the search that led here had one.
   *
   * Carried purely so destination search can bias to it. Someone searching a
   * trip from Velachery means the Velachery end of the map, and ranking against
   * the device position instead would be wrong whenever they are planning a
   * journey from somewhere they are not currently standing.
   */
  origin: LngLat | null;
  originLabel: string | null;
  /** Where the squad is going. Never the meeting point. */
  destination: PickedPlace | null;
  /** ISO departure, or null for "not decided yet". */
  departAt: string | null;
  /** Only set once the leader has typed over the suggested name. */
  name: string | null;
  purpose: SquadType | null;
  capacity: number | null;
  visibility: SquadVisibility | null;
  /** Where the members physically meet before travelling. Never the destination. */
  meetingPoint: PickedPlace | null;
}

/**
 * Parses a coordinate, rejecting anything outside the real range.
 *
 * Hand-edited URLs reach this, and a NaN or a longitude of 4000 would sail
 * through as a "meeting point" that the map cannot draw and the backend would
 * have to reject later. Refusing it here means a bad parameter degrades to "no
 * meeting point chosen" rather than to a broken screen.
 */
function coord(value: string | null, limit: number): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) return null;
  return parsed;
}

/** Reads a draft back out of `useSearchParams()`. Tolerates anything. */
export function readSquadDraft(params: URLSearchParams): SquadDraft {
  /**
   * Destination comes through `readTripSearch` rather than being re-parsed
   * here, so the create form reads exactly what the planner writes and the two
   * cannot drift. It carries no address — the trip-search URL never had one —
   * which is the same shape the form already used before this module existed.
   */
  const trip = readTripSearch(params);
  const destination: PickedPlace | null =
    trip.destination && trip.destinationLabel
      ? {
          lng: trip.destination[0],
          lat: trip.destination[1],
          label: trip.destinationLabel,
          address: null,
        }
      : null;

  const meetingLng = coord(params.get('meetingLng'), 180);
  const meetingLat = coord(params.get('meetingLat'), 90);
  const meetingLabel = params.get('meetingPlace');

  /**
   * How the pin was chosen, and how well it is known.
   *
   * Both are read back defensively and both are omitted rather than defaulted
   * when absent or nonsense. A hand-edited URL claiming a two-metre GPS accuracy
   * for a pin nobody stood on would be a lie the card then repeats, and a missing
   * value has to mean "not recorded" rather than "exact".
   */
  /**
   * `params.get` answers null for a parameter that is not there, and `Number(null)`
   * is 0 — so reading a missing number straight through `Number` turns "not
   * recorded" into a real value. Each of these is therefore checked for absence
   * before it is parsed, and left undefined rather than defaulted.
   */
  const number = (key: string): number | undefined => {
    const raw = params.get(key);
    if (raw === null) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };

  const accuracy = number('meetingAccuracy');
  const accuracyMetres = accuracy !== undefined && accuracy > 0 ? accuracy : undefined;

  const roadDistance = number('meetingRoadM');
  const roadDistanceMetres = roadDistance !== undefined && roadDistance >= 0 ? roadDistance : undefined;

  const sourceParam = params.get('meetingSource');
  const source = isGeoSource(sourceParam) ? sourceParam : undefined;

  /**
   * The feature type travels; the precision integer is derived from it on
   * arrival.
   *
   * Carrying the integer instead was the earlier mistake. Its meaning comes from
   * a table in `place-ranking` that is a ranking judgement rather than a fact, so
   * a number written into a URL before that table was tuned would come back
   * meaning something else. The provider's own word does not move.
   */
  const featureType = params.get('meetingFeature') ?? undefined;
  const precision = featureType === undefined ? undefined : featurePrecision(featureType);

  const meetingPoint: PickedPlace | null =
    meetingLng !== null && meetingLat !== null && meetingLabel
      ? {
          lng: meetingLng,
          lat: meetingLat,
          label: meetingLabel,
          address: params.get('meetingAddress'),
          ...(featureType === undefined ? {} : { featureType }),
          ...(precision === undefined ? {} : { precision }),
          ...(accuracyMetres === undefined ? {} : { accuracyMetres }),
          ...(roadDistanceMetres === undefined ? {} : { roadDistanceMetres }),
          ...(source === undefined ? {} : { source }),
        }
      : null;

  const purposeParam = params.get('purpose');
  const purpose = SQUAD_PURPOSES.some((option) => option.value === purposeParam)
    ? (purposeParam as SquadType)
    : null;

  const capacityParam = Number(params.get('capacity'));
  const capacity = (SQUAD_CAPACITIES as readonly number[]).includes(capacityParam)
    ? capacityParam
    : null;

  const visibilityParam = params.get('visibility');
  const visibility: SquadVisibility | null =
    visibilityParam === 'public' || visibilityParam === 'invite' ? visibilityParam : null;

  const nameParam = params.get('name')?.trim();

  return {
    origin: trip.origin,
    originLabel: trip.originLabel,
    destination,
    departAt: trip.departAt,
    name: nameParam ? nameParam.slice(0, MAX_NAME) : null,
    purpose,
    capacity,
    visibility,
    meetingPoint,
  };
}

/**
 * Builds the query string for a draft.
 *
 * Empty values are omitted rather than written as blanks, matching
 * `tripSearchParams` — so a draft with nothing in it produces an empty query
 * and `/squads/new` rather than `/squads/new?`.
 */
export function squadDraftParams(draft: SquadDraft): URLSearchParams {
  // Destination and departure are delegated, so those three parameter names are
  // spelled in exactly one place in the codebase.
  const params = tripSearchParams({
    origin: draft.origin,
    originLabel: draft.originLabel,
    destination: draft.destination ? [draft.destination.lng, draft.destination.lat] : null,
    destinationLabel: draft.destination?.label ?? null,
    departAt: draft.departAt,
  });

  const name = draft.name?.trim();
  if (name) params.set('name', name.slice(0, MAX_NAME));
  if (draft.purpose) params.set('purpose', draft.purpose);
  if (draft.capacity) params.set('capacity', String(draft.capacity));
  if (draft.visibility) params.set('visibility', draft.visibility);

  if (draft.meetingPoint) {
    // Six decimals is ~0.1 m — the same precision tripSearchParams uses, so a
    // pin never shifts between screens.
    params.set('meetingLng', draft.meetingPoint.lng.toFixed(6));
    params.set('meetingLat', draft.meetingPoint.lat.toFixed(6));
    params.set('meetingPlace', draft.meetingPoint.label);
    // Omitted when Mapbox had no address for the point, rather than written as
    // an empty string — there is no such thing as a blank address, and reading
    // one back would make an unnamed pin look named.
    if (draft.meetingPoint.address) params.set('meetingAddress', draft.meetingPoint.address);

    /**
     * What the pin is, and how well it is known, written alongside where it is.
     *
     * Without these the round trip out to the map and back was lossy in a way
     * nothing on screen admitted: a pin dropped from a device fix accurate to
     * 300 m came back indistinguishable from one somebody had pointed at, and a
     * roadside point the leader had accepted came back looking like their own
     * choice. The coordinate survived; everything that qualified it did not.
     *
     * Each is omitted when absent, so a draft carries no claim it cannot support.
     */
    const { featureType, accuracyMetres, roadDistanceMetres, source } = draft.meetingPoint;
    // The provider's word, not the integer derived from it — see `readSquadDraft`.
    if (featureType) params.set('meetingFeature', featureType);
    if (accuracyMetres !== undefined) params.set('meetingAccuracy', String(Math.round(accuracyMetres)));
    if (roadDistanceMetres !== undefined) params.set('meetingRoadM', String(Math.round(roadDistanceMetres)));
    if (source) params.set('meetingSource', source);
  }

  return params;
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** Back to the create form, carrying the draft. */
export function squadNewHref(draft: SquadDraft): string {
  return withQuery('/squads/new', squadDraftParams(draft));
}

/** Out to the map picker, carrying the draft. */
export function meetingPointHref(draft: SquadDraft): string {
  return withQuery('/location', squadDraftParams(draft));
}
