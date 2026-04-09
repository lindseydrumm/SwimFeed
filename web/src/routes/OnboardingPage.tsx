import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/Card';
import { Stepper } from '../../components/Stepper';
import { FollowButton } from '../../components/FollowButton';
import { useUser } from '../store/UserStore';
import type { OnboardingGoal, DigestPreference, UserProfile } from '../types/domain';

const STROKES: { value: StrokePreference; label: string }[] = [
    { value: 'butterfly', label: 'Butterfly' },
    { value: 'backstroke', label: 'Backstroke' },
    { value: 'breaststroke', label: 'Breaststroke' },
    { value: 'freestyle', label: 'Freestyle' },
];

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

const DIGEST_OPTIONS: { value: DigestPreference; label: string }[] = [
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly roundup' },
  { value: 'big_news_only', label: 'Big news only' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding } = useUser();

  const [step, setStep] = useState(0);
  const [lane, setLane] = useState<'beginner' | 'experienced' | null>(null);

  const [displayName, setDisplayName] = useState('Jordan');
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [interests, setInterests] = useState<Record<string, string[]>>({
    strokes: [],
    distances: [],
    countries: [],
    topics: [],
  });
  const [digestPreference, setDigestPreference] = useState<DigestPreference>('weekly');
  const [strokePreference, setStrokePreference] = useState<StrokePreference[]>([])

  const steps = ['Welcome', 'Lane', ...(lane === 'experienced' ? ['Athletes', 'Events', 'Interests'] : ['Strokes', 'Learn']), 'Signup'];

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
      interests,
      digestPreference,
      onboardingComplete: true,
    };
    await completeOnboarding(profile);
    navigate('/', { replace: true });
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <Stepper steps={steps} currentStep={step} className="mb-8" />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 text-center">
            <h1 className="text-2xl font-semibold text-white">Welcome</h1>
            <p className="text-slate-400">Let’s personalize your experience in a few quick steps.</p>
            <button onClick={() => setStep(1)} className="px-6 py-3 bg-cyan-500 text-white rounded-lg">Get started</button>
          </motion.div>
        )}

      {/* LANE */}
      {step === 1 && (
          <motion.div
            key="lane"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col"
          >
          <h2 className="text-xl font-semibold text-white text-center mb-8">Pick your lane</h2>

          {/* Full-height lane container */}
          <div className="flex flex-1 min-h-[78vh] border-t border-slate-700">
            {/* BEGINNER */}
            <button
              onClick={() => {
                setLane('beginner');
                setStep(2);
              }}
              className={`flex-1 relative flex flex-col justify-end p-6 border-r border-slate-700 transition-all duration-300
                ${lane === 'beginner' ? 'bg-cyan-500/10' : 'bg-transparent'}
                hover:bg-cyan-500/10`}
            >
              {/* gradient to background */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 pointer-events-none" />

              {/* pool "T" marker */}
              {/* vertical part */}
              <div className="absolute top-14 bottom-20 left-1/2 -translate-x-1/2 w-[10px] bg-slate-500/70 bg-gradient-to-b from-transparent to-slate-900" />
              {/* horizontal part */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-20 h-[9px] bg-slate-500/70" />

              {/* content */}
              <div className="relative z-10 text-left text-top">
                <p className="text-lg font-semibold text-white">Beginner</p>
                <p className="text-sm text-slate-400 mt-1">New to swimming? Learn the basics and build confidence.</p>
              </div>
            </button>

            {/* EXPERIENCED */}
            <button
              onClick={() => {
                setLane('experienced');
                setStep(2);
              }}
              className={`flex-1 relative flex flex-col justify-end p-6 transition-all duration-300
                ${lane === 'experienced' ? 'bg-cyan-500/10' : 'bg-transparent'}
                hover:bg-cyan-500/10`}
            >
              {/* gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900 pointer-events-none" />

              {/* pool "T" marker */}
              {/* vertical part */}
              <div className="absolute top-14 bottom-20 left-1/2 -translate-x-1/2 w-[10px] bg-slate-500/70 bg-gradient-to-b from-transparent to-slate-900" />
              {/* horizontal part */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-20 h-[9px] bg-slate-500/70" />


              {/* content */}
              <div className="relative z-10 text-left">
                <p className="text-lg font-semibold text-white">Experienced</p>
                <p className="text-sm text-slate-400 mt-1">Dive deeper with athletes, events, and insights.</p>
              </div>
            </button>
          </div>
        </motion.div>
        )}


        {/* EXPERIENCED FLOW */}
        {lane === 'experienced' && step === 2 && (
          <motion.div key="athletes" className="space-y-6">
            <h2 className="text-xl text-white">Follow athletes</h2>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm">
                Back
              </button>
              <button onClick={() => setStep(3)} className="bg-cyan-500 px-4 py-2 rounded">Next</button>
            </div>
          </motion.div>
        )}

        {lane === 'experienced' && step === 3 && (
          <motion.div key="events" className="space-y-6">
            <h2 className="text-xl text-white">Follow events</h2>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(2)} className="text-slate-400 hover:text-white text-sm">
                Back
              </button>
              <button onClick={() => setStep(4)} className="bg-cyan-500 px-4 py-2 rounded">Next</button>
            </div>
          </motion.div>
        )}

        {lane === 'experienced' && step === 4 && (
          <motion.div key="interests" className="space-y-6">
            <h2 className="text-xl text-white">Your interests</h2>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(3)} className="text-slate-400 hover:text-white text-sm">
                Back
              </button>
              <button onClick={() => setStep(5)} className="bg-cyan-500 px-4 py-2 rounded">Next</button>
            </div>
          </motion.div>
        )}

        {/* BEGINNER FLOW */}
        {lane === 'beginner' && step === 2 && (
          <motion.div key="strokes" className="space-y-6">
            <h2 className="text-xl text-white">Pick strokes</h2>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm">
                Back
              </button>
              <button onClick={() => setStep(3)} className="bg-cyan-500 px-4 py-2 rounded">Next</button>
             </div>
           </motion.div>
        )}

        {lane === 'beginner' && step === 3 && (
          <motion.div key="learn" className="space-y-6">
            <h2 className="text-xl text-white">What do you want to learn?</h2>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(2)} className="text-slate-400 hover:text-white text-sm">
                Back
              </button>
              <button onClick={() => setStep(4)} className="bg-cyan-500 px-4 py-2 rounded">Next</button>
            </div>
          </motion.div>
        )}

        {/* SIGNUP (FINAL) */}
        {((lane === 'experienced' && step === 5) || (lane === 'beginner' && step === 4)) && (
          <motion.div key="signup" className="space-y-6">
             <h2 className="text-xl text-white">Finish setup</h2>

             {DIGEST_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setDigestPreference(opt.value)} className="block w-full text-left p-3 bg-slate-800 rounded">
                    {opt.label}
                </button>
             ))}

             <input
               value={displayName}
               onChange={(e) => setDisplayName(e.target.value)}
               className="w-full p-2 bg-slate-800 rounded"
             />
             <div className="flex justify-between pt-4">
               <button type="button" onClick={() => setStep(4)} className="text-slate-400 hover:text-white text-sm">
                 Back
               </button>
               <button onClick={handleFinish} className="bg-cyan-500 px-4 py-2 rounded">Finish</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
