'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Car, User } from 'lucide-react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';
import { hostService } from '@/lib/services/host';
import { useAuth } from '@/lib/auth/auth-provider';

/**
 * Rider ⇄ Host switch.
 *
 * Both sides are the same account. Splitting a driver into a second login
 * would fork their rating, their chat history and their money, and would hand
 * anyone with a bad record a clean slate for the price of a second phone
 * number — so this is a view switch, and `HostProfile.status` is what actually
 * gates driving.
 *
 * Someone with no host profile still sees the switch: it is how they find out
 * host mode exists, and /host/setup is where it leads.
 */
export function HostModeSwitch({ className }: { className?: string }) {
  const pathname = usePathname();
  const { status } = useAuth();

  const { data: host } = useQuery({
    queryKey: ['host', 'me'],
    queryFn: () => hostService.me(),
    enabled: status === 'authenticated',
    staleTime: 60_000,
  });

  const hostMode = pathname === '/host' || pathname.startsWith('/host/');

  // A host who has not finished verification lands on setup rather than a
  // dashboard that can only tell them to go and finish verification.
  const hostHref = host?.profile.status === 'active' ? '/host' : '/host/setup';

  const options = [
    { key: 'rider', label: 'Ride', href: '/home', Icon: User, on: !hostMode },
    { key: 'host', label: 'Drive', href: hostHref, Icon: Car, on: hostMode },
  ];

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 rounded-full border border-line bg-surface-sunken p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <Link
          key={option.key}
          href={option.href}
          aria-current={option.on ? 'page' : undefined}
          className={cn(
            'relative flex items-center gap-1.5 rounded-full px-3 py-1.5',
            'text-[12.5px] font-medium transition-colors duration-snap',
            option.on ? 'text-ink' : 'text-ink-muted hover:text-ink',
          )}
        >
          {option.on ? (
            <motion.span
              layoutId="host-mode-pill"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="absolute inset-0 rounded-full bg-surface shadow-soft"
            />
          ) : null}
          <option.Icon className="relative h-3.5 w-3.5" />
          <span className="relative hidden sm:block">{option.label}</span>
        </Link>
      ))}
    </div>
  );
}
