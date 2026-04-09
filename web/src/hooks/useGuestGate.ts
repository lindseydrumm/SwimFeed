import { useAuth, useClerk } from '@clerk/clerk-react';

/**
 * Returns isGuest flag and requireAuth() wrapper.
 * Call requireAuth(fn) on any mutation — guests get the sign-in modal, signed-in users execute fn.
 */
export function useGuestGate() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  function requireAuth(fn: () => void) {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    fn();
  }

  return { isGuest: !isSignedIn, requireAuth };
}
