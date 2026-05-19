/**
 * Guests pass through freely.
 * Signed-in users are redirected to /onboarding until their profile is complete.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useUser } from '../store/UserStore';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { state, ready } = useUser();
  const location = useLocation();

  if (!isLoaded || !ready) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  // Guests see the page as-is — no onboarding required
  if (!isSignedIn) return <>{children}</>;

  // Signed-in users must complete onboarding before accessing personalised pages
  if (!state?.profile?.onboardingComplete) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
