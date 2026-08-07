/**
 * Domain types. These mirror backend/prisma/schema.prisma — when the schema
 * changes, change these in the same commit.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string | null;
  address?: string | null;
}

/** [lng, lat] — Mapbox order. Kept distinct from GeoPoint to avoid mix-ups. */
export type LngLat = [number, number];

export interface User {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  college: string;
  /** Stable institute id; `college` is the display name. */
  instituteId: string | null;
  /** Verified institute address, if any. */
  instituteEmail: string | null;
  /** Gates creating and joining rides. */
  instituteVerified: boolean;
  gender: string;
  profilePhoto: string | null;
  rating: number;
  totalRides: number;
  homeCity: string | null;
  onboarded: boolean;
  /** Drives whether the Admin surface is offered. The API enforces it too. */
  role: 'user' | 'subadmin' | 'admin';
  createdAt: string;
}

/**
 * How a companion relates to the trip being planned. The map colours pins by
 * this, because each one implies a different next action: join, ride along,
 * or invite.
 */
export type CompanionKind = 'host' | 'passenger' | 'online';

/** Someone heading the same way, from GET /rides/companions. */
export interface TripCompanion {
  user: UserSummary;
  kind: CompanionKind;
  /** True when the position came from a live broadcast, not a stated origin. */
  live: boolean;
  lat: number;
  lng: number;
  rideId: string | null;
  origin: string | null;
  destination: string | null;
  departureTime: string | null;
  vehicleType: VehicleType | null;
  seatsLeft: number | null;
  fare: number | null;
  /** From the caller's pickup point. Null when the caller has no location. */
  distanceMetres: number | null;
}

/**
 * One host whose route passes the guest's pickup and drop-off, in that order.
 * From GET /rides/search.
 */
export interface RideSearchHit {
  ride: Ride;
  /** How far the guest walks to meet the route at each end. */
  pickupWalkMetres: number;
  dropoffWalkMetres: number;
  /** Distance travelled together along the host's route. */
  sharedMetres: number;
  seatsLeft: number;
  /** False when the match fell back to straight-line geometry. */
  routed: boolean;
  /** The host's road route, when Directions returned one. */
  route: LngLat[] | null;
}

export interface RideSearchResult {
  items: RideSearchHit[];
  /** The corridor width the server actually applied, in metres. */
  corridorMetres: number;
}

export interface CompanionSearch {
  items: TripCompanion[];
  /** Centroid of everyone's origins — a starting point for the meeting pin. */
  meetingSuggestion: { lat: number; lng: number } | null;
}

// --- Matching -------------------------------------------------------------

/** A rider's published intent, which is what makes them findable by hosts. */
export interface TripRequest {
  id: string;
  userId: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  destLabel: string;
  destLat: number;
  destLng: number;
  departAt: string;
  windowMins: number;
  seats: number;
  status: 'open' | 'matched' | 'cancelled' | 'expired';
  expiresAt: string;
  createdAt: string;
}

/** The host's vehicle as a rider sees it, once they are on the trip. */
export interface HostVehicleCard {
  type: VehicleType;
  brandLabel: string;
  modelLabel: string;
  colour: string | null;
  plateFormatted: string;
  seats: number;
}

/**
 * Everything a rider is owed about their driver. Only ever populated for an
 * accepted passenger — a pending invite carries the public summary alone.
 */
export interface HostDossier {
  user: UserSummary;
  phone: string | null;
  about: string | null;
  rating: number;
  ratingCount: number;
  ridesHosted: number;
  vehicle: HostVehicleCard | null;
}

export interface RideInvite {
  id: string;
  status: 'pending' | 'accepted';
  matchedAt: string;
  ride: Ride;
  host: UserSummary | null;
  /** Null until accepted. */
  dossier: HostDossier | null;
  /** Chat opens on acceptance, not on invitation. */
  threadId: string | null;
}

/** A rider whose published trip fits the host's route. */
export interface RideCandidate {
  request: {
    id: string;
    originLabel: string;
    destLabel: string;
    departAt: string;
    seats: number;
  };
  user: UserSummary;
  detourMetres: number;
  dropoffDetourMetres: number;
  sharedMetres: number;
  /** Null when the host has not reached out yet. */
  inviteStatus: 'pending' | 'accepted' | null;
}

export interface RideCandidateResult {
  items: RideCandidate[];
  corridorMetres: number;
  /** False when the corridor fell back to straight-line geometry. */
  routed: boolean;
}

// --- Host mode ------------------------------------------------------------

/** `active` is the only status permitted to post rides. */
export type HostStatus = 'pending' | 'active' | 'suspended';
export type VehicleStatus = 'pending' | 'verified' | 'rejected';

export interface Vehicle {
  id: string;
  type: VehicleType;
  brandId: string;
  modelId: string;
  brandLabel: string;
  modelLabel: string;
  colour: string | null;
  /** Normalised: uppercase, no separators. */
  plate: string;
  /** Grouped for display, e.g. "TN 07 CV 1234". */
  plateFormatted: string;
  seats: number;
  status: VehicleStatus;
  rejectionNote: string | null;
  isPrimary: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export interface HostProfile {
  id: string;
  userId: string;
  phone: string;
  phoneVerified: boolean;
  about: string | null;
  status: HostStatus;
  suspendedReason: string | null;
  ridesHosted: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
}

/** GET /host/me — null before the user has ever opened host mode. */
export interface HostAccount {
  profile: HostProfile;
  vehicles: Vehicle[];
}

export interface VehicleModelOption {
  id: string;
  label: string;
  /** Passenger seats excluding the driver — the cap the server enforces. */
  seats: number;
}

export interface VehicleBrandOption {
  id: string;
  label: string;
  type: VehicleType;
  models: VehicleModelOption[];
}

/** Trimmed shape used in lists, avatars and markers. */
export interface UserSummary {
  id: string;
  name: string;
  username: string | null;
  profilePhoto: string | null;
  college: string | null;
  rating?: number;
}

// --- Rides ----------------------------------------------------------------

export const RIDE_STATUSES = [
  'requested',
  'accepted',
  'arriving',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type RideStatus = (typeof RIDE_STATUSES)[number];

export type VehicleType = 'cab' | 'bike' | 'auto';

export interface Ride {
  id: string;
  userId: string;
  host: UserSummary | null;
  origin: string;
  originLat: number | null;
  originLng: number | null;
  destination: string;
  destLat: number;
  destLng: number;
  stops: GeoPoint[];
  departureTime: string;
  vehicleType: VehicleType;
  seats: number;
  seatsTaken: number;
  fare: number | null;
  genderPref: 'male' | 'female' | 'any';
  status: RideStatus;
  passengers: UserSummary[];
  createdAt: string;
}

/** Live tracking frame for a ride, delivered over Socket.IO — never persisted. */
export interface RideTracking {
  rideId: string;
  lat: number;
  lng: number;
  heading: number | null;
  etaSeconds: number | null;
  distanceMetres: number | null;
  updatedAt: number;
}

// --- Squads ---------------------------------------------------------------

export interface Squad {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  leaderId: string;
  leader: UserSummary | null;
  college: string | null;
  type: SquadType;
  visibility: 'public' | 'private' | 'invite';
  /** Shareable six-character code. Only returned to members. */
  joinCode: string | null;
  status: 'active' | 'completed' | 'cancelled';
  memberLimit: number | null;
  themeColor: string | null;
  destination: GeoPoint | null;
  meetingPoint: GeoPoint | null;
  meetingAt: string | null;
  memberCount: number;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  createdAt: string;
  /** Present only on detail responses. */
  members?: SquadMember[];
  /** Whether the requesting user is a member — server-computed. */
  viewerRole?: SquadRole | null;
  /**
   * What the viewer may do, sent by the server so the client renders the same
   * permission model it enforces instead of re-deriving one that drifts.
   * Null for non-members.
   */
  can?: SquadCapabilities | null;
}

export type SquadRole = 'leader' | 'co-leader' | 'member' | 'guest';
export type SquadMemberStatus = 'pending' | 'active' | 'travelling' | 'arrived' | 'left';
export type SquadType =
  | 'study'
  | 'travel'
  | 'event'
  | 'office'
  | 'hostel'
  | 'sports'
  | 'general';

export interface SquadMember {
  id: string;
  userId: string;
  user: UserSummary;
  role: SquadRole;
  status: SquadMemberStatus;
  etaSeconds: number | null;
  joinedAt: string;
}

/** What the viewer may do. Mirrors the server's one capability table. */
export interface SquadCapabilities {
  view: boolean;
  chat: boolean;
  shareLocation: boolean;
  setMeetingPoint: boolean;
  admitMembers: boolean;
  manageMembers: boolean;
  assignRoles: boolean;
  destroy: boolean;
}

/** One member's journey to the meeting point. */
export interface SquadProgressEntry {
  user: UserSummary;
  role: SquadRole;
  status: SquadMemberStatus;
  lat: number | null;
  lng: number | null;
  locationAt: string | null;
  battery: number | null;
  network: string | null;
  arrivedAt: string | null;
  distanceMetres: number | null;
  etaSeconds: number | null;
}

export interface SquadProgress {
  meetingAt: string | null;
  items: SquadProgressEntry[];
}

export interface SquadJoinRequest {
  id: string;
  user: UserSummary;
  requestedAt: string;
}

// --- Events ---------------------------------------------------------------

export interface SpllitEvent {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  hostId: string;
  host: UserSummary | null;
  college: string | null;
  venue: GeoPoint;
  startsAt: string;
  endsAt: string | null;
  ticketType: 'free' | 'paid';
  price: number | null;
  capacity: number | null;
  attendeeCount: number;
  category: string | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  viewerAttending?: boolean;
}

// --- Communities ----------------------------------------------------------

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  college: string | null;
  visibility: 'public' | 'college-only' | 'private';
  memberCount: number;
  ownerId: string;
  channels?: Channel[];
  viewerIsMember?: boolean;
}

export interface Channel {
  id: string;
  communityId: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  isReadOnly: boolean;
  unreadCount?: number;
}

// --- Chat -----------------------------------------------------------------

export type ChatContextType = 'squad' | 'ride' | 'channel' | 'dm';

export type MessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'location'
  | 'live-location'
  | 'meeting-point'
  | 'ride-invite';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  sender: UserSummary | null;
  content: string;
  type: MessageType;
  metadata: Record<string, unknown> | null;
  replyToId: string | null;
  createdAt: string;
  /** Client-only: message is queued locally and not yet confirmed by the server. */
  pending?: boolean;
  failed?: boolean;
}

export interface ChatThread {
  id: string;
  contextType: ChatContextType;
  contextId: string;
  title: string;
  imageUrl: string | null;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  participants: UserSummary[];
  updatedAt: string;
}

// --- Notifications --------------------------------------------------------

export const NOTIFICATION_TYPES = [
  'squad.joined',
  'squad.meeting_point_updated',
  'ride.accepted',
  'ride.arriving',
  'ride.started',
  'ride.completed',
  'ride.cancelled',
  'friend.nearby',
  'event.created',
  'event.reminder',
  'community.mention',
  'chat.message',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  imageUrl: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

// --- Live layer (Socket.IO) ----------------------------------------------

export interface LivePosition {
  userId: string;
  lat: number;
  lng: number;
  heading: number | null;
  updatedAt: number;
}

export type PresenceState = 'online' | 'away' | 'offline';

export interface Presence {
  userId: string;
  state: PresenceState;
  lastSeen: number;
}

// --- Search ---------------------------------------------------------------

export type SearchTab = 'people' | 'squads' | 'events' | 'places' | 'rides';

export interface PlaceResult {
  id: string;
  name: string;
  address: string | null;
  center: LngLat;
}

export interface SearchResults {
  people: UserSummary[];
  squads: Squad[];
  events: SpllitEvent[];
  communities: Community[];
  places: PlaceResult[];
  rides: Ride[];
}

// --- Misc -----------------------------------------------------------------

export type ComingSoonService = 'rentals' | 'bills' | 'marketplace';

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}
