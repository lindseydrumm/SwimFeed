/**
 * Redirects to /onboarding if profile not set or onboarding not complete.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../store/UserStore';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { state, ready } = useUser();
  const location = useLocation();
  if (!ready) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  const complete = state?.profile?.onboardingComplete;
  if (!complete) return <Navigate to="/onboarding" state={{ from: location }} replace />;
  return <>{children}</>;
}
