import type { SquadType } from '@/types';

/**
 * Squad purposes offered by the create flow, in the order they are shown.
 *
 * `study` and `hostel` are deliberately absent: they predate the
 * destination-first redesign and still exist on old records, but nothing new
 * should be created with them.
 */
export const SQUAD_PURPOSES: ReadonlyArray<{ value: SquadType; label: string; icon: string }> = [
  { value: 'exam', label: 'Exam', icon: '🎓' },
  { value: 'college', label: 'College', icon: '🏫' },
  { value: 'office', label: 'Office', icon: '💼' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'event', label: 'Event', icon: '🎉' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'concert', label: 'Concert', icon: '🎵' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'general', label: 'Other', icon: '✨' },
];

const LABELS: Record<SquadType, string> = {
  exam: 'Exam',
  college: 'College',
  office: 'Office',
  shopping: 'Shopping',
  travel: 'Travel',
  event: 'Event',
  concert: 'Concert',
  sports: 'Sports',
  general: 'Other',
  // Legacy values, still rendered on squads created before the redesign.
  study: 'Study',
  hostel: 'Hostel',
};

export function purposeLabel(type: SquadType): string {
  return LABELS[type] ?? 'Other';
}

const ICONS: Record<SquadType, string> = {
  exam: '🎓',
  college: '🏫',
  office: '💼',
  shopping: '🛍️',
  travel: '✈️',
  event: '🎉',
  concert: '🎵',
  sports: '⚽',
  general: '✨',
  // Legacy values still stored on older squads.
  study: '📚',
  hostel: '🏠',
};

/**
 * Emoji for a purpose. Decorative everywhere it is used — always paired with
 * the label and marked aria-hidden, because an emoji alone is not a word.
 */
export function purposeIcon(type: SquadType): string {
  return ICONS[type] ?? '✨';
}

/**
 * Long place names ("Anna University, Sardar Patel Road, Chennai") make an
 * unreadable squad name. Mapbox puts the distinctive part first, so the segment
 * before the first comma is the useful one.
 */
function shortPlaceName(label: string): string {
  const head = label.split(',')[0]?.trim() ?? label.trim();
  return head.length > 34 ? `${head.slice(0, 33).trimEnd()}…` : head;
}

/**
 * The name a squad gets before the leader touches it.
 *
 * Built from destination and purpose because that is what a squad *is* — the
 * previous flow asked for a name first, which produced "Friday studio session"
 * and told nobody where it was going. The leader can still overwrite it; this
 * only has to be a good enough default that most people never do.
 */
export function suggestSquadName(destinationLabel: string, purpose: SquadType): string {
  const place = shortPlaceName(destinationLabel);
  if (!place) return '';

  switch (purpose) {
    case 'exam':
      return `${place} exam run`;
    case 'office':
      return `${place} commute`;
    case 'shopping':
      return `${place} shopping trip`;
    case 'event':
      return `${place} meetup`;
    case 'concert':
      return `${place} concert ride`;
    case 'sports':
      return `${place} match run`;
    default:
      return `Trip to ${place}`;
  }
}
