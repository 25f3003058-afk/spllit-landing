import { cn } from '@/lib/utils';

/**
 * Skeletons must match the dimensions of the content they stand in for —
 * that is what keeps CLS at zero (Section 7.8). Prefer the shaped variants
 * below over ad-hoc grey boxes.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden />;
}

/** Matches ListRow / RideCard / SquadCard height exactly. */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Horizontal rail placeholder — same 280px card width as the real rail. */
export function SkeletonRail({ count = 3 }: { count?: number }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-[168px] w-[280px] shrink-0 rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Shown while the Mapbox bundle downloads and the GL context initialises.
 * Deliberately not a spinner — a shimmering map-shaped surface reads as
 * "the map is coming" rather than "something is stuck".
 */
export function SkeletonMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'skeleton relative h-full w-full overflow-hidden rounded-lg',
        className,
      )}
      aria-label="Loading map"
      role="status"
    >
      {/* Faint street-grid suggestion so the placeholder reads as a map. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        aria-hidden
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="skeleton-grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0v64" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#skeleton-grid)" />
      </svg>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-24 w-24 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
