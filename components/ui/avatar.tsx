import Image from 'next/image';

import { cn, initialsOf } from '@/lib/utils';
import type { UserSummary } from '@/types';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm',
  xl: 'h-24 w-24 text-xl',
} as const;

const PX = { xs: 24, sm: 32, md: 40, lg: 56, xl: 96 } as const;

export type AvatarSize = keyof typeof SIZES;

export function Avatar({
  src,
  name,
  size = 'md',
  className,
  online,
}: {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
  online?: boolean;
}) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-full',
          'bg-surface-sunken font-semibold uppercase text-ink-muted ring-1 ring-line',
          SIZES[size],
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={name ?? 'Profile photo'}
            width={PX[size]}
            height={PX[size]}
            className="h-full w-full object-cover"
          />
        ) : (
          initialsOf(name)
        )}
      </span>
      {online ? (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-surface"
          aria-label="Online"
        />
      ) : null}
    </span>
  );
}

/** Overlapping avatar row with a +N overflow chip. */
export function AvatarStack({
  users,
  max = 4,
  size = 'sm',
}: {
  users: UserSummary[];
  max?: number;
  size?: AvatarSize;
}) {
  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((user) => (
          <Avatar
            key={user.id}
            src={user.profilePhoto}
            name={user.name}
            size={size}
            className="ring-2 ring-surface"
          />
        ))}
      </div>
      {overflow > 0 ? (
        <span className="ml-2 text-xs font-medium text-ink-muted">+{overflow}</span>
      ) : null}
    </div>
  );
}
