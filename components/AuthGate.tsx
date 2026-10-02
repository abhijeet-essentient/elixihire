'use client';

import type { ReactNode } from 'react';
import { LoginScreen } from './LoginScreen';
import { useAuth } from '@/lib/auth';

/**
 * Renders the demo only once the viewer has signed in.
 *
 * The locked branch renders *instead of* `children`, never over it, so no screen's
 * markup reaches the page — including in the pre-rendered HTML that ships for every
 * route, where `authed` is always false.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { authed, checked } = useAuth();

  // Before the stored session has been read — which includes the pre-rendered HTML —
  // render the login screen, marked so the layout's pre-paint probe can hide it
  // instantly for a viewer who is already signed in.
  if (!checked) return <LoginScreen prehydration />;

  if (!authed) return <LoginScreen />;

  return <>{children}</>;
}
