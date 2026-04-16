/**
 * Onboarding wizard: 4 steps. Persists via useUser().completeOnboarding().
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Stepper } from '../../components/Stepper';
import { FollowButton } from '../../components/FollowButton';
import { useUser } from '../store/UserStore';
import { useGuestGate } from '../hooks/useGuestGate';
import type { OnboardingGoal, DigestPreference, UserProfile } from '../types/domain';
import type { SwimEvent } from '../types/domain';
import { getEvents } from '../api/events';

const GOALS: { value: OnboardingGoal; label: string }[] = [
  { value: 'news', label: 'News & stories' },
  { value: 'events', label: 'Events & meets' },
  { value: 'athletes', label: 'Athletes' },
  { value: 'training', label: 'Training & technique' },
];

const INTEREST_CHIPS = {
  strokes: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'],
  distances: ['Sprint (50–100)', 'Middle (200–400)', 'Distance (800+)', 'Open water'],
  countries: ['USA', 'AUS', 'GBR', 'FRA', 'CAN', 'CHN', 'ROU', 'HUN'],
  topics: ['Olympics', 'Worlds', 'NCAA', 'Technique', 'Records', 'Interviews'],
};

const RECOMMENDED_ATHLETES = [
  { id: 'marchand', name: 'Léon Marchand', meta: { country: 'FRA' } },
  { id: 'mcinintosh', name: 'Summer McIntosh', meta: { country: 'CAN' } },
  { id: 'ledecky', name: 'Katie Ledecky', meta: { country: 'USA' } },
  { id: 'dressel', name: 'Caeleb Dressel', meta: { country: 'USA' } },
  { id: 'popovici', name: 'David Popovici', meta: { country: 'ROU' } },
];

const RECOMMENDED_EVENTS = [
  { id: 'worlds-2025', name: 'World Aquatics Championships 2025', meta: {} },
  { id: 'olympics-2024', name: 'Paris 2024 Olympics', meta: {} },
];

const DIGEST_OPTIONS: { value: DigestPreference; label: string }[] = [
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly roundup' },
  { value: 'big_news_only', label: 'Big news only' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding, isFollowing } = useUser();
  const { requireAuth } = useGuestGate();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('Jordan');
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [interests, setInterests] = useState<Record<string, string[]>>({
    strokes: [],
    distances: [],
    countries: [],
    topics: [],
  });
  const [digestPreference, setDigestPreference] = useState<DigestPreference>('weekly');
  const [recommendedEvents, setRecommendedEvents] = useState<SwimEvent[]>([]);

  const steps = ['Goals', 'Interests', 'Follow', 'Digest'];
  const totalSteps = steps.length;

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((evs) => {
        if (cancelled) return;
        setRecommendedEvents(evs.slice(0, 3));
      })
      .catch(() => {
        if (cancelled) return;
        setRecommendedEvents([]);
      });
    return () => { cancelled = true; };
  }, []);

  const toggleGoal = (g: OnboardingGoal) => {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const toggleInterest = (category: keyof typeof INTEREST_CHIPS, value: string) => {
    setInterests((prev) => {
      const list = prev[category] ?? [];
      const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
      return { ...prev, [category]: next };
    });
  };

  const handleFinish = async () => {
    const profile: UserProfile = {
      displayName,
      goals,
      interests: {
        strokes: interests.strokes,
        distances: interests.distances,
        countries: interests.countries,
        topics: interests.topics,
      },
      digestPreference,
      onboardingComplete: true,
    };
    requireAuth(async () => {
      await completeOnboarding(profile);
      navigate('/', { replace: true });
    });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <Stepper steps={steps} currentStep={step} className="mb-8" />
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">What do you want to follow?</h2>
            <p className="text-slate-400 text-sm">Select at least one (you can change this later).</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => toggleGoal(g.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    goals.includes(g.value) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="interests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">Your interests</h2>
            <p className="text-slate-400 text-sm">Pick strokes, distances, and topics you care about.</p>
            <div className="space-y-4">
              {(Object.keys(INTEREST_CHIPS) as (keyof typeof INTEREST_CHIPS)[]).map((cat) => (
                <div key={cat}>
                  <p className="text-slate-500 text-xs uppercase mb-2">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_CHIPS[cat].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => toggleInterest(cat, val)}
                        className={`px-3 py-1.5 rounded-full text-sm ${
                          (interests[cat] ?? []).includes(val) ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 border border-slate-700 text-slate-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(0)} className="text-slate-400 hover:text-white text-sm">
                Back
              </button>
              <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium">
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="follow"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">Follow athletes & events</h2>
            <p className="text-slate-400 text-sm">We&apos;ll personalize your feed. You can add more later.</p>
            <Card animate={false}>
              <CardContent className="p-4 space-y-4">
                <p className="text-slate-400 text-xs uppercase">Recommended athletes</p>
                <div className="flex flex-col gap-3">
                  {RECOMMENDED_ATHLETES.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-slate-700/50 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-white">{a.name}</p>
                        {a.meta?.country && (
                          <p className="text-xs text-slate-500">{String(a.meta.country)}</p>
                        )}
                      </div>
                      <FollowButton entityType="athlete" entityId={a.id} name={a.name} meta={a.meta} />
                    </div>
                  ))}
                </div>
                <p className="text-slate-400 text-xs uppercase pt-4">Recommended events</p>
                <div className="flex flex-col gap-3">
                  {(recommendedEvents.length > 0 ? recommendedEvents : RECOMMENDED_EVENTS).map((e: any) => (
                    <div
                      key={String(e.id)}
                      className="flex items-center justify-between gap-3 py-2 border-b border-slate-700/50 last:border-0"
                    >
                      <p className="font-medium text-white">{e.name}</p>
                      <FollowButton
                        entityType="event"
                        entityId={String(e.id)}
                        name={e.name}
                        meta={e.meta}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium">
                Next
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="digest"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">How often should we update you?</h2>
            <p className="text-slate-400 text-sm">Digest preference (UI only for now).</p>
            <div className="space-y-2">
              {DIGEST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDigestPreference(opt.value)}
                  className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                    digestPreference === opt.value ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 border border-slate-700 text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="pt-2">
              <label className="block text-slate-400 text-sm mb-1">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(2)} className="text-slate-400 hover:text-white text-sm">
                Back
              </button>
              <button type="button" onClick={handleFinish} className="px-4 py-2 rounded-lg bg-cyan-500 text-white text-sm font-medium">
                Finish
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
