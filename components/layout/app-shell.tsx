'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { DockNav } from '@/components/layout/dock-nav';
import { TopBar } from '@/components/layout/topbar';
import { HelpWidget } from '@/components/support/help-widget';
import { CreateSheet } from '@/components/layout/create-sheet';
import { LegalFooter } from '@/components/shared/legal-footer';

/**
 * One layout tree for every breakpoint.
 *
 * Content is a single full-width column — navigation is the floating dock at
 * every size, so there is no sidebar and no rail. The activity rail that used
 * to sit on the right was removed: each of its three sections (notifications,
 * nearby, upcoming) already has a route of its own, so it duplicated
 * destinations rather than adding any, and it took 300px from every page to do
 * it.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  /**
   * Transient sheets store the route they were opened on rather than a plain
   * boolean, so navigating away closes them by derivation. An effect that
   * reset them on pathname change would fire a second render pass on every
   * navigation just to close something that is usually already closed.
   */
  const [createOpenPath, setCreateOpenPath] = useState<string | null>(null);

  const createOpen = createOpenPath === pathname;

  /**
   * Routes that own the full viewport and manage their own chrome, so the
   * shell drops its padding and scroll container for them. The trip planner is
   * one: it is a multi-column layout with its own map pane.
   */
  const isImmersive = pathname === '/map' || pathname === '/home';

  return (
    <div className="flex min-h-dvh bg-canvas">
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        <main
          className={cn(
            // overflow-x-clip is a backstop: one mis-sized full-bleed child
            // should never put a horizontal scrollbar on the whole page.
            'min-w-0 flex-1 overflow-x-clip',
            isImmersive
              ? 'relative'
              : // Bottom padding clears the floating dock (56px panel plus
                // its offset and magnification headroom).
                'px-4 pb-32 pt-6 sm:px-5 lg:px-6 lg:pt-grid',
          )}
        >
          {children}

          {/* Immersive routes own the whole viewport, so the footer would sit
              on top of a map. They are reachable from the account menu. */}
          {isImmersive ? null : <LegalFooter className="mt-10" />}
        </main>
      </div>

      <DockNav onCreate={() => setCreateOpenPath(pathname)} />

      <CreateSheet open={createOpen} onClose={() => setCreateOpenPath(null)} />

      {/* Support entry point, available on every authenticated screen. */}
      <HelpWidget />
    </div>
  );
}
