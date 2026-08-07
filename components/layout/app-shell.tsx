'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { DockNav } from '@/components/layout/dock-nav';
import { TopBar } from '@/components/layout/topbar';
import { ActivityPanel } from '@/components/layout/activity-panel';
import { CreateSheet } from '@/components/layout/create-sheet';
import { Sheet } from '@/components/ui/sheet';

/**
 * One layout tree for every breakpoint (Section 4):
 *   ≥1280px  content + persistent activity rail
 *   <1280px  activity rail becomes a slide-over
 *
 * Navigation is the floating dock at every size — there is no sidebar, so the
 * content column is full width and the same components simply reflow.
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
  const [activityOpenPath, setActivityOpenPath] = useState<string | null>(null);

  const createOpen = createOpenPath === pathname;
  const activityOpen = activityOpenPath === pathname;

  /**
   * Routes that own the full viewport and manage their own chrome, so the
   * shell drops its padding and scroll container for them. The trip planner is
   * one: it is a three-column layout with its own map pane, and the shell's
   * padding plus the activity rail would leave the map a sliver.
   */
  const isImmersive = pathname === '/map' || pathname === '/home';

  return (
    <div className="flex min-h-dvh bg-canvas">
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenActivity={() => setActivityOpenPath(pathname)} />

        <div className="flex min-h-0 flex-1">
          <main
            className={cn(
              // overflow-x-clip is a backstop: one mis-sized full-bleed child
              // should never put a horizontal scrollbar on the whole page.
              'min-w-0 flex-1 overflow-x-clip',
              isImmersive
                ? 'relative'
                : // Bottom padding clears the floating dock (56px panel plus
                  // its offset and magnification headroom). It applies at every
                  // size now — the dock no longer hands off to a sidebar.
                  'px-4 pb-32 pt-6 sm:px-5 lg:px-6 lg:pt-grid',
            )}
          >
            {children}
          </main>

          {/* Persistent activity rail — widest breakpoint only, and never on
              an immersive route, which needs the width for its own panes. */}
          {isImmersive ? null : (
            <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-[300px] shrink-0 overflow-y-auto border-l border-line bg-canvas xl:block">
              <ActivityPanel />
            </aside>
          )}
        </div>
      </div>

      <DockNav onCreate={() => setCreateOpenPath(pathname)} />

      <CreateSheet open={createOpen} onClose={() => setCreateOpenPath(null)} />

      {/* Same ActivityPanel, presented as a slide-over below xl. */}
      <div className="xl:hidden">
        <Sheet
          open={activityOpen}
          onClose={() => setActivityOpenPath(null)}
          title="Activity"
          side="right"
        >
          <ActivityPanel className="-mx-5" />
        </Sheet>
      </div>
    </div>
  );
}
