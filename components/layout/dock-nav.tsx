'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { useHidingOnScroll } from '@/lib/hooks/use-scroll-direction';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/motion-primitives/dock';
import { DOCK_NAV, HOST_DOCK_NAV, SOON_NAV, type NavItem } from '@/content/nav';

/**
 * The application's navigation, at every breakpoint.
 *
 * This replaced the left sidebar outright rather than sitting beside it, so it
 * carries everything the sidebar did: the primary destinations, the create
 * action, the phase-2 surfaces (dimmed) and the role-gated admin link. Nothing
 * may be dropped here without becoming unreachable except by typing a URL.
 *
 * Icon-only by design. The primitive's DockLabel is a hover tooltip, which a
 * touch device can never trigger — rather than bolt captions underneath (they
 * fight the panel's fixed height and throw the centring out), the active item
 * carries a filled circle and a dot.
 */
function DockLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={item.comingSoon ? `${item.label} — coming soon` : item.label}
      aria-current={active ? 'page' : undefined}
      className={cn('relative', !item.essential && 'hidden sm:block')}
    >
      <DockItem
        className={cn(
          'aspect-square rounded-full transition-colors duration-snap',
          active ? 'bg-brand-muted' : 'bg-surface-sunken',
          // Dimmed, not hidden: the route works, it just has nothing in it yet.
          item.comingSoon && 'opacity-45',
        )}
      >
        <DockLabel className="border-line bg-surface text-ink">
          {item.comingSoon ? `${item.label} · soon` : item.label}
        </DockLabel>
        <DockIcon>
          <Icon
            className={cn(
              'h-full w-full transition-colors duration-snap',
              active ? 'text-brand' : 'text-ink-muted',
            )}
            strokeWidth={active ? 2.3 : 1.9}
          />
        </DockIcon>
      </DockItem>

      {/* Current-page marker: the only state cue an icon-only bar has. */}
      {active ? (
        <span
          aria-hidden
          className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand"
        />
      ) : null}
    </Link>
  );
}

export function DockNav({ onCreate }: { onCreate: () => void }) {
  const pathname = usePathname();
  const hidden = useHidingOnScroll();
  const { profile } = useAuth();

  /**
   * Mode comes from the URL, not from state. A host who bookmarks /host/trips
   * or refreshes mid-shift lands back in host mode without a provider having
   * to rehydrate anything, and there is no way for the nav and the page to
   * disagree about which mode is showing.
   */
  const hostMode = pathname === '/host' || pathname.startsWith('/host/');
  // Offering the link is presentation; /api/admin-panel enforces the real gate.
  const isAdmin = profile?.role === 'admin' || profile?.role === 'subadmin';

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-30 flex justify-center',
        // Clears the iOS home indicator.
        'bottom-[calc(0.5rem+env(safe-area-inset-bottom))]',
        /**
         * Slides away while reading down, returns on the first upward scroll.
         * The dock covers the last ~80px of every page, which is exactly where
         * the end of an article, a list or an empty state sits.
         *
         * Translated rather than unmounted so it animates both ways and its
         * focus order never changes; `invisible` at the end of the transition
         * keeps it out of the tab order while it is off-screen.
         */
        'transition-[transform,opacity] duration-300 ease-out',
        hidden
          ? 'pointer-events-none translate-y-[140%] opacity-0'
          : 'translate-y-0 opacity-100',
      )}
      aria-hidden={hidden}
    >
      {/* max-w-full + the primitive's own overflow-x-auto: on a narrow phone
          eleven items cannot fit, and the dock scrolls rather than forcing the
          page to. */}
      <div className="pointer-events-auto max-w-full">
        <Dock
          className={cn(
            // Panel defaults are gap-4 / px-4 / rounded-2xl; only the surface
            // and the bottom padding are overridden so the reference's
            // proportions survive.
            'items-end gap-2.5 rounded-2xl px-3 pb-3 sm:gap-3.5 sm:px-4',
            'border border-line/70 bg-glass shadow-float backdrop-blur-glass',
          )}
          magnification={62}
          distance={120}
          panelHeight={56}
        >
          {(hostMode ? HOST_DOCK_NAV : DOCK_NAV).map((item) => (
            <DockLink key={item.href} item={item} />
          ))}

          {/* The phase-2 surfaces are rider-side only. */}
          {/* Phase-2 surfaces are desktop-only in the dock: three dimmed icons
              for pages that do not exist yet is not what a phone's six slots
              are for. They stay reachable by URL and from the account menu. */}
          {hostMode ? null : (
            <>
              <span
                aria-hidden
                className="hidden h-7 w-px shrink-0 self-center bg-line sm:block"
              />
              {SOON_NAV.map((item) => (
                <DockLink key={item.href} item={item} />
              ))}
            </>
          )}

          {isAdmin ? (
            <DockLink item={{ href: '/admin', label: 'Admin', icon: ShieldCheck }} />
          ) : null}

          {/* Create anchors the far end: one fixed, always-reachable position
              regardless of how many destinations precede it. */}
          <span aria-hidden className="h-7 w-px shrink-0 self-center bg-line" />

          <DockItem
            onClick={onCreate}
            className="aspect-square rounded-full bg-brand text-brand-fg shadow-soft ring-1 ring-inset ring-black/5"
          >
            <DockLabel className="border-line bg-surface text-ink">
              {hostMode ? 'Offer a ride' : 'Create'}
            </DockLabel>
            <DockIcon>
              {/* Inset rather than edge-to-edge: at full magnification a
                  100%-width glyph touches the circle and reads as a crop. */}
              <Plus className="h-[78%] w-[78%]" strokeWidth={2.6} />
            </DockIcon>
          </DockItem>
        </Dock>
      </div>
    </div>
  );
}
