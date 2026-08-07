'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/auth-provider';

/**
 * Route guard for the authenticated app.
 *
 * While Firebase is still resolving the session we render the shell skeleton
 * rather than bouncing to /auth — a returning user must never see a flash of
 * the sign-in page (Section 5.2).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'signed-out') {
      const next = encodeURIComponent(pathname);
      router.replace(`/auth?next=${next}`);
    } else if (status === 'onboarding') {
      router.replace('/auth');
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return <>{children}</>;
}
