import { formatCountdown, formatTime } from '@/lib/utils';
import { purposeLabel } from '@/lib/squad-purpose';
import type { MapEntity } from '@/lib/map/types';
import type { Ride, Squad, SpllitEvent, UserSummary, Community } from '@/types';

/**
 * Domain → MapEntity adapters. These are the only place that knows how a Ride
 * or a Squad becomes a marker, which is what keeps <SplitMap /> generic enough
 * to accept a new Phase 2 type by adding one function here.
 */

export function rideToEntity(ride: Ride): MapEntity | null {
  if (ride.originLat === null || ride.originLng === null) return null;
  const seatsLeft = Math.max(0, ride.seats - ride.seatsTaken);
  return {
    id: `ride:${ride.id}`,
    layer: 'rides',
    position: [ride.originLng, ride.originLat],
    title: ride.destination,
    subtitle: `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} · ${formatCountdown(ride.departureTime)}`,
    live: ride.status === 'arriving' || ride.status === 'in_progress',
    href: `/rides/${ride.id}`,
  };
}

/**
 * Squads sit on the map at their **meeting point**, never their destination.
 * People walk to where the squad gathers — a marker on the middle of a mall
 * when everyone is meeting at Gate 2 sends them to the wrong place.
 */
export function squadToEntity(squad: Squad): MapEntity | null {
  const lng = squad.meetingPoint?.lng ?? squad.lng;
  const lat = squad.meetingPoint?.lat ?? squad.lat;
  if (lng === null || lat === null || lng === undefined || lat === undefined) return null;

  const head = (label: string | null | undefined) => label?.split(',')[0]?.trim() || null;
  const destination = head(squad.destination?.label);
  const meeting = head(squad.meetingPoint?.label);
  const capacity = squad.memberLimit ? `${squad.memberCount}/${squad.memberLimit}` : `${squad.memberCount}`;

  const facts = [
    { label: 'Leader', value: squad.leader?.name ?? 'Unknown' },
    { label: 'Members', value: capacity },
    { label: 'Purpose', value: purposeLabel(squad.type) },
    ...(meeting ? [{ label: 'Meeting point', value: meeting }] : []),
    ...(squad.meetingAt ? [{ label: 'Leaving', value: formatTime(squad.meetingAt) }] : []),
  ];

  return {
    id: `squad:${squad.id}`,
    layer: 'squads',
    position: [lng, lat],
    // Destination leads: it is what someone scanning the map is looking for.
    title: destination ?? squad.name,
    subtitle: `${capacity} · ${destination ? squad.name : purposeLabel(squad.type)}`,
    live: squad.isActive,
    imageUrl: squad.imageUrl,
    href: `/squads/${squad.id}`,
    marker: 'meeting',
    facts,
  };
}

export function eventToEntity(event: SpllitEvent): MapEntity {
  return {
    id: `event:${event.id}`,
    layer: 'events',
    position: [event.venue.lng, event.venue.lat],
    title: event.title,
    subtitle: `${event.attendeeCount} going · ${formatCountdown(event.startsAt)}`,
    live: false,
    imageUrl: event.imageUrl,
    href: `/events/${event.id}`,
  };
}

export function personToEntity(
  person: UserSummary,
  position: [number, number],
): MapEntity {
  return {
    id: `person:${person.id}`,
    layer: 'friends',
    position,
    title: person.name,
    subtitle: person.college,
    live: true,
    imageUrl: person.profilePhoto,
    href: `/profile/${person.id}`,
  };
}

export function communityToEntity(
  community: Community,
  position: [number, number],
): MapEntity {
  return {
    id: `community:${community.id}`,
    layer: 'communities',
    position,
    title: community.name,
    subtitle: `${community.memberCount} members`,
    imageUrl: community.imageUrl,
    href: `/communities/${community.id}`,
  };
}

/** Strips the `type:` prefix used to keep marker ids unique across layers. */
export function entityDomainId(entityId: string): string {
  const index = entityId.indexOf(':');
  return index === -1 ? entityId : entityId.slice(index + 1);
}
