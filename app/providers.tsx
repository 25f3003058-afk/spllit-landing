'use client';

import { useEffect, type ReactNode } from 'react';

import { QueryProvider } from '@/lib/query/provider';
import { AuthProvider, useAuth } from '@/lib/auth/auth-provider';
import { connectSocket, disconnectSocket, setSocketTokenProvider } from '@/lib/live/socket';
import { RealtimeBridge } from '@/components/live/realtime-bridge';

/**
 * Bridges Firebase identity into the socket layer, so the live connection
 * authenticates with the same token as HTTP requests and is torn down cleanly
 * on sign-out.
 */
function SocketBridge({ children }: { children: ReactNode }) {
  const { firebaseUser, status } = useAuth();

  useEffect(() => {
    if (!firebaseUser) {
      setSocketTokenProvider(null);
      disconnectSocket();
      return;
    }

    setSocketTokenProvider(() => firebaseUser.getIdToken());
    connectSocket();

    return () => {
      // Only tear down on sign-out, not on every render — the effect key is
      // the user object, which is stable while signed in.
      if (status === 'signed-out') disconnectSocket();
    };
  }, [firebaseUser, status]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketBridge>
          {/* Listens once for the whole app — see RealtimeBridge for why the
              per-screen listeners were not enough. Renders nothing. */}
          <RealtimeBridge />
          {children}
        </SocketBridge>
      </AuthProvider>
    </QueryProvider>
  );
}
