import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthFlow } from '@/components/auth/auth-flow';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
};

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md space-y-4 px-5 py-24">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      }
    >
      <AuthFlow />
    </Suspense>
  );
}
