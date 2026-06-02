/**
 * SwimLive startup splash: full-screen overlay where each letter of
 * "SwimLive" flies in from a different edge of the screen, layered over a
 * swimming-themed animated background (water gradient + lane lines + rising
 * bubbles). Plays a fixed ~2.5s sequence, then fades out and calls onComplete.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const WORD = 'SwimLive';
// Index at which the cyan-colored "Live" begins.
const CYAN_FROM = 4;

// Deterministic off-screen start offsets so each letter enters from a
// distinct edge/corner (top, bottom, left, right and diagonals).
const ENTRY_OFFSETS = [
  { x: -900, y: -500, rotate: -120 }, // S  - top-left
  { x: 0, y: -800, rotate: 90 },      // w  - top
  { x: 900, y: -500, rotate: 120 },   // i  - top-right
  { x: 1000, y: 0, rotate: 200 },     // m  - right
  { x: 900, y: 600, rotate: -160 },   // L  - bottom-right
  { x: 0, y: 850, rotate: -90 },      // i  - bottom
  { x: -900, y: 600, rotate: 160 },   // v  - bottom-left
  { x: -1000, y: 0, rotate: -200 },   // e  - left
];

interface Bubble {
  id: number;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  const prefersReduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const bubbles = useMemo<Bubble[]>(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 8 + Math.random() * 26,
        duration: 4 + Math.random() * 4,
        delay: Math.random() * 3,
      })),
    [],
  );

  useEffect(() => {
    const total = prefersReduced ? 1200 : 2500;
    const timer = setTimeout(() => setVisible(false), total);
    return () => clearTimeout(timer);
  }, [prefersReduced]);

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: prefersReduced ? 0.04 : 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const letterVariants = {
    initial: (i: number) => {
      const off = ENTRY_OFFSETS[i % ENTRY_OFFSETS.length];
      return {
        x: off.x,
        y: off.y,
        rotate: prefersReduced ? 0 : off.rotate,
        opacity: 0,
        scale: 0.4,
      };
    },
    animate: {
      x: 0,
      y: 0,
      rotate: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 140,
        damping: 14,
        mass: 0.9,
      },
    },
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
        >
          {/* Water gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(at 50% 30%, rgba(0,212,255,0.18) 0px, transparent 55%)',
            }}
          />

          {/* Animated lane lines */}
          <div className="absolute inset-0 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute top-0 w-[6px] bg-slate-600/30"
                style={{
                  height: '200%',
                  left: `${10 + i * 20}%`,
                }}
                animate={{ y: ['-50%', '0%'] }}
                transition={{
                  duration: 6 + i,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
          </div>

          {/* Rising bubbles */}
          <div className="absolute inset-0 overflow-hidden">
            {bubbles.map((b) => (
              <motion.div
                key={b.id}
                className="absolute rounded-full bg-cyan-400/20 border border-cyan-300/20"
                style={{
                  left: b.left,
                  bottom: -40,
                  width: b.size,
                  height: b.size,
                }}
                animate={{
                  y: [0, -window.innerHeight - 80],
                  opacity: [0, 0.7, 0],
                }}
                transition={{
                  duration: b.duration,
                  delay: b.delay,
                  repeat: Infinity,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>

          {/* Flying SwimLive letters */}
          <motion.h1
            className="relative z-10 flex font-bold tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl select-none"
            variants={containerVariants}
            initial="initial"
            animate="animate"
            style={{ filter: 'drop-shadow(0 0 24px rgba(0,212,255,0.35))' }}
          >
            {WORD.split('').map((ch, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                className={i >= CYAN_FROM ? 'text-cyan-400' : 'text-white'}
              >
                {ch}
              </motion.span>
            ))}
          </motion.h1>

          {/* Tagline pulse beneath the word */}
          <motion.p
            className="absolute bottom-[28%] text-slate-400 text-sm sm:text-base tracking-wide"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReduced ? 0.5 : 1.4, duration: 0.6 }}
          >
            Follow the sport. Track the moments.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
