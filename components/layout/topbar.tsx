'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { useUnreadCount } from '@/lib/hooks/queries';
import { SearchToolbar } from '@/components/layout/search-toolbar';
import { HostModeSwitch } from '@/components/host/mode-switch';
import { NotificationsPanel } from '@/components/notifications/notifications-panel';
import { AccountMenu } from '@/components/layout/account-menu';

/**
 * Header. Navigation lives in the dock, so this carries only identity
 * (the logo), search and notifications.
 */
export function TopBar() {
  const { profile } = useAuth();
  const { data: unread } = useUnreadCount(Boolean(profile));

  const [panelOpen, setPanelOpen] = useState(false);

  const count = unread?.count ?? 0;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-glass">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <Link href="/home" className="flex items-center gap-2.5">
          <Image
            src="/logo-icon.png"
            alt="Spllit"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md"
            priority
          />
          {/* The wordmark moved here from the sidebar; it is the only place the
              product still names itself inside the app. */}
          <span className="hidden font-display text-[15px] font-semibold tracking-[-0.02em] text-ink sm:block">
            Spllit
          </span>
        </Link>

        {/* Ride/Drive changes what the whole app is for, so it sits with the
            logo as a primary control rather than in the utility cluster on the
            right.
            
            Hidden below sm entirely: the header is five controls wide, which
            fits a 360px phone only just and overflows a 320px one. On a phone
            the switch lives in the account menu, where it has room for a label
            instead of being two unlabelled icons. */}
        <div className="ml-2 hidden sm:block">
          <HostModeSwitch />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SearchToolbar />

          {/* Anchor for the panel, so it drops from the bell rather than from
              the header edge. */}
          <div className="relative">
            <button
              onClick={() => setPanelOpen((value) => !value)}
              aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
              aria-expanded={panelOpen}
              className="relative rounded-md p-2 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              <Bell className="h-[18px] w-[18px]" />
              {count > 0 ? (
                <span
                  className={cn(
                    'absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full',
                    'bg-brand px-1 text-[9px] font-bold text-brand-fg',
                  )}
                >
                  {count > 9 ? '9+' : count}
                </span>
              ) : null}
            </button>

            {panelOpen ? (
              <div className="absolute right-0 top-full z-30 mt-2">
                <NotificationsPanel onClose={() => setPanelOpen(false)} />
              </div>
            ) : null}
          </div>

          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
