import { calculateDistance } from '../utils/helpers.js';

/**
 * How well a squad matches what someone actually searched for.
 *
 * One function, used only by the discovery query. Ranking logic that lives in
 * two places disagrees with itself the first time either is edited, and the
 * number is shown to users — a card claiming "best match" has to be produced by
 * the same arithmetic that put it on top.
 *
 * The weights encode a priority order, not a guess at importance:
 *
 *   destination 35 · pickup 25 · time 20 · meeting point 12 · capacity 5 · purpose 3
 *
 * Destination outranks everything because "going to the same place" is the
 * whole premise; a squad heading elsewhere is not a worse match, it is not a
 * match. Pickup comes next so that Velachery→Fortune Tower beats
 * Taramani→Fortune Tower for someone starting in Velachery, which is the case
 * that made the old distance-only ordering feel arbitrary.
 *
 * Every input is read from stored squad fields. Nothing is inferred, and a
 * factor with no data scores zero rather than a flattering default — a squad
 * with no meeting point set should not be rewarded for it.
 */

export interface RankInput {
  /** Where the searcher is starting. */
  origin: { lat: number; lng: number };
  /** Where they are going. Discovery already filters on this. */
  destination?: { lat: number; lng: number } | null;
  /** When they want to leave, if they said. */
  departAt?: Date | null;
  /** Squad purpose they filtered by, if any. */
  purpose?: string | null;
}

export interface RankableSquad {
  lat: number | null;
  lng: number | null;
  destination: unknown;
  meetingPoint: unknown;
  meetingAt: Date | null;
  type: string;
  memberCount: number;
  memberLimit: number | null;
}

export interface RankResult {
  /** 0–100. Comparable only within one search. */
  score: number;
  /** Short, user-facing, and only for things actually measured. */
  reasons: string[];
}

function point(value: unknown): { lat: number; lng: number } | null {
  const p = value as { lat?: unknown; lng?: unknown } | null;
  const lat = Number(p?.lat);
  const lng = Number(p?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** 1 at zero distance, 0 at `fadeKm` and beyond. Linear — no false precision. */
function proximity(km: number, fadeKm: number): number {
  if (!Number.isFinite(km)) return 0;
  return Math.max(0, 1 - km / fadeKm);
}

export function rankSquad(squad: RankableSquad, input: RankInput): RankResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. Destination — the premise. Discovery has already filtered to squads
  //    heading near the searched destination; this rewards how near.
  const dest = point(squad.destination);
  if (input.destination && dest) {
    const km = calculateDistance(input.destination.lat, input.destination.lng, dest.lat, dest.lng);
    score += 35 * proximity(km, 5);
    if (km <= 1) reasons.push('Same destination');
  }

  // 2. Pickup — is this squad forming where the searcher already is.
  if (squad.lat !== null && squad.lng !== null) {
    const km = calculateDistance(input.origin.lat, input.origin.lng, squad.lat, squad.lng);
    score += 25 * proximity(km, 12);
    if (km <= 2) reasons.push('Near your pickup');
  }

  // 3. Departure time.
  let hoursApart: number | null = null;
  if (input.departAt && squad.meetingAt) {
    const mins = Math.abs(squad.meetingAt.getTime() - input.departAt.getTime()) / 60000;
    hoursApart = mins / 60;
    score += 20 * proximity(mins, 240);
    if (mins <= 30) reasons.push(`${Math.round(mins)} min from your time`);
  }

  // 4. Meeting point — how far the searcher walks to join the group.
  const meet = point(squad.meetingPoint);
  if (meet) {
    const km = calculateDistance(input.origin.lat, input.origin.lng, meet.lat, meet.lng);
    score += 12 * proximity(km, 8);
    if (km <= 1.5) reasons.push('Meeting point close by');
  }

  // 5. Capacity. Small: room to join is a requirement (enforced elsewhere by
  //    withFreeSlots), not a reason to prefer one open squad over another.
  if (squad.memberLimit) {
    const free = Math.max(0, squad.memberLimit - squad.memberCount);
    if (free > 0) score += 5 * Math.min(1, free / squad.memberLimit);
  } else {
    score += 5;
  }

  // 6. Purpose, only when the searcher chose one.
  if (input.purpose && squad.type === input.purpose) {
    score += 3;
    reasons.push('Same purpose');
  }

  /**
   * A ceiling when the time is badly wrong.
   *
   * Without it a squad in exactly the right place scores in the eighties while
   * leaving six hours away — and "92% match" beside a departure nobody can use
   * is worse than no number at all. Geography cannot make a time work.
   */
  if (hoursApart !== null && hoursApart > 3) score = Math.min(score, 55);

  return { score: Math.round(Math.max(0, Math.min(100, score))), reasons: reasons.slice(0, 3) };
}
