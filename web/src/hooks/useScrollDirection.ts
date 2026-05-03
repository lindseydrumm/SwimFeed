/**
 * useScrollDirection — tracks vertical scroll direction with a small deadzone
 * to prevent jitter, and forces "visible" near the top of the page.
 *
 * Use case: hide a sticky header on scroll-down, reveal on scroll-up.
 *
 *   const { hidden } = useScrollDirection();
 *
 * Options:
 *   - deadzone:  px the user must scroll past lastY before direction flips (default 8)
 *   - topZone:   px from page top where the bar is forced visible (default 80)
 */
import { useEffect, useRef, useState } from 'react';

interface Options {
  deadzone?: number;
  topZone?: number;
}

export function useScrollDirection({ deadzone = 8, topZone = 80 }: Options = {}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - lastY.current;

        if (y < topZone) {
          // Always show near top
          setHidden(false);
          lastY.current = y;
        } else if (diff > deadzone) {
          setHidden(true);
          lastY.current = y;
        } else if (diff < -deadzone) {
          setHidden(false);
          lastY.current = y;
        }
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [deadzone, topZone]);

  return { hidden };
}
