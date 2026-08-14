import { api } from '@/lib/api/client';
import type { SquadType } from '@/types';

/**
 * The assistive half of the create flow.
 *
 * One endpoint, and it creates nothing. It reads a sentence and answers with
 * the fields the form would have asked for, which the form then shows filled in
 * for the leader to check. Every squad is still created by
 * `POST /api/squads` after somebody presses the button.
 */

export interface AiDraftPlace {
  lng: number;
  lat: number;
  label: string;
  address: string | null;
  featureType: string | null;
}

export interface AiSquadDraft {
  destination: AiDraftPlace | null;
  origin: AiDraftPlace | null;
  /** ISO instant, guaranteed by the server to be in the future. */
  departAt: string | null;
  purpose: SquadType | null;
  capacity: number | null;
  /** Place names that were in the sentence but could not be found on the map. */
  unresolved: string[];
  /** False when nothing usable came back, for any reason. */
  understood: boolean;
}

/**
 * Describes a trip in one sentence and gets back a draft.
 *
 * The timezone offset is sent rather than left to the server: "tomorrow 9am"
 * is a statement about the sender's calendar, and a server behind a proxy has
 * no reliable way to know which day that is for them.
 *
 * `Date.getTimezoneOffset()` returns minutes to *subtract* from local time to
 * reach UTC — negated here so the value sent is minutes to add to UTC, which is
 * the direction people write offsets in and the direction the server applies.
 */
export async function draftSquadFromText(input: {
  text: string;
  near?: [number, number] | null;
  /**
   * Abandons the wait.
   *
   * Only the wait: the model call is already in flight on the server and will
   * run to completion and be billed. This does not save the call, it gives the
   * person their form back — which is the thing they actually wanted.
   */
  signal?: AbortSignal;
}): Promise<AiSquadDraft> {
  return api.post<AiSquadDraft>(
    '/ai/squad-draft',
    {
      text: input.text,
      utcOffsetMinutes: -new Date().getTimezoneOffset(),
      ...(input.near ? { lng: input.near[0], lat: input.near[1] } : {}),
    },
    input.signal ? { signal: input.signal } : {},
  );
}

export interface AiStatus {
  /** False when the server has no model configured. */
  squadDraft: boolean;
}

export function fetchAiStatus(): Promise<AiStatus> {
  return api.get<AiStatus>('/ai/status');
}
