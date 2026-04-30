/**
 * Onboarding wizard: 4 steps. Persists via useUser().completeOnboarding().
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/Card';
import { Stepper } from '../../components/Stepper';
import { useUser } from '../store/UserStore';
import { useGuestGate } from '../hooks/useGuestGate';
import type { OnboardingGoal, DigestPreference, UserProfile, SwimEvent } from '../types/domain';
import { getAthletesBySlug } from '../api/athletes';
import { getEvents } from '../api/events';
import { WelcomePage } from './WelcomePage'

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

type PoolKey = 'Irvine' | 'Indianapolis' | 'Default' ;

const POOL_IMAGES: Record<PoolKey, string> = {
  Irvine: 'https://ocbj.wppcdn.com/wp-content/uploads/2025/01/Sports-Colun-010625.jpg',
  Indianapolis: 'https://images2.minutemediacdn.com/image/upload/c_crop,x_0,y_210,w_6823,h_3837/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/images/ImagnImages/mmsport/si/01j08xqehhmtemqqfxz4.jpg',
  Default: 'https://d1s9j44aio5gjs.cloudfront.net/2016/03/underwater_london_aquatics_centre_competitive_swimming_pools.jpg',
    
};

type FlagKey = 'ROU' | 'CAN' | 'FRA' | 'AUS' ;

const FLAG_CODES: Record<FlagKey, string> = {
    
}

export function OnboardingPage() {
  console.log('OnboardingPage rendered');
  const navigate = useNavigate();
  const { completeOnboarding, isFollowing } = useUser();
  const { requireAuth } = useGuestGate();

  const [step, setStep] = useState(0);
  const [lane, setLane] = useState<'beginner' | 'experienced' | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [interests, setInterests] = useState<Record<string, string[]>>({
    strokes: [],
    distances: [],
    countries: [],
    topics: [],
  });
    
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
    
  const [carouselIndex, setCarouselIndex] = useState(0);
    
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
    
  const [digestPreference, setDigestPreference] = useState<DigestPreference>('weekly');

  const [recommendedEvents, setRecommendedEvents] = useState<SwimEvent[]>([]);

  const steps = ['Welcome', 'Lane', 'Athletes', 'Events', 'Digest'];

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
    
  const getPoolImage = (key: string) =>
      POOL_IMAGES[key] ?? POOL_IMAGES['Default'];
    
  // load pre-selected athletes
  useEffect(() => {
    const load = async () => {
      try {
        const [athleteData, eventData] = await Promise.all([
            getAthletesBySlug([
              'leon-marchand',
              'summer-mcintosh',
              'katie-ledecky',
              'david-popovici',
              'kaylee-mckeown',
            ]),
            getEvents(),
          ]);
          console.log('ATHLETES DATA:', athleteData);
          console.log('EVENTS DATA:', eventData)
          setAthletes(athleteData);
          setEvents(eventData.slice(0, 3));
        } catch (e) {
          console.error('failed to load data', e);
        }
      };
      load();
    }, []);

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
            try {
              await completeOnboarding(profile);
              navigate('/', { replace: true });
            } catch (e) {
              console.error('Onboarding failed:', e);
            }
          });
        };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <Stepper steps={steps} currentStep={step} className="mb-8" />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <div className="fixed inset-0">
            <WelcomePage onStart={() => setStep(1)} />
          </div>
        )}

      {/* PICK A LANE */}
          {step === 1 && (
                          <motion.div
                          key="lane"
                          initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
                          animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
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
                          
                          <div className="flex justify-between pt-4">
                          <button onClick={() => setStep(0)} className="text-slate-400 hover:text-white text-sm">Back</button>
                          <div className="flex gap-3">
                          <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white text-sm">Skip</button>
                          <button onClick={() => setStep(2)} className="bg-cyan-500 hover:bg-cyan-400 transition-colors text-white px-4 py-2 rounded">Next</button>
                          </div>
                          </div>
                          </motion.div>
                          )}
          
          {/* FOLLOW ATHLETES */}
          {step === 2 && (() => {
            const SLOT_WIDTH = 230;
            const total = athletes.length || 1;
    
            return (
                    <motion.div key="athletes" className="space-y-8 text-center">
            <div>
            <h2 className="text-xl text-white font-semibold">Follow top athletes</h2>
            <p className="text-sm text-slate-400 mt-2">Pick a few to personalize your feed. Click to select.</p>
            </div>
            
            <div className="relative flex items-center justify-center h-72 overflow-visible select-none">
            <button
            onClick={() => setCarouselIndex(prev => prev - 1)}
            className="absolute left-0 z-20 text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-full w-9 h-9 flex items-center justify-center transition-all"
            style={{ fontSize: '22px' }}
            >‹</button>
            
            <div className="relative w-full h-full flex items-center justify-center">
            {athletes.map((a, rawIndex) => {
                const selected = selectedAthletes.includes(a.id);
                
                // Compute the shortest-path offset from current center
                let offset = rawIndex - ((carouselIndex % total) + total) % total;
                if (offset > total / 2) offset -= total;
                if (offset < -total / 2) offset += total;
                
                const absOffset = Math.abs(offset);
                const xPx = offset * SLOT_WIDTH;
                const scale = absOffset === 0 ? 1 : 0.68;
                const opacity = absOffset <= 1 ? (absOffset === 0 ? 1 : 0.5) : 0;
                
                return (
                        <div
                        key={a.id}
                        className="absolute flex flex-col items-center"
                        style={{
                            transform: `translateX(${xPx}px) scale(${scale})`,
                            opacity,
                            zIndex: absOffset === 0 ? 10 : 5,
                            transition: 'transform 0.45s cubic-bezier(0.35, 0, 0.25, 1), opacity 0.45s ease, scale 0.45s ease',
                            pointerEvents: absOffset === 0 ? 'auto' : 'none',
                        }}
                        >
                        <button
                        onClick={() =>
                            setSelectedAthletes(prev =>
                                                prev.includes(a.id)
                                                ? prev.filter(id => id !== a.id)
                                                : [...prev, a.id]
                                                )
                        }
                        className="group"
                        >
                        <div className="p-1 rounded-full bg-gradient-to-br from-cyan-500/30 to-slate-700/30">
                        <div
                        className={`w-60 h-60 rounded-full overflow-hidden border-2 transition-all duration-300
                                ${selected ? 'border-cyan-400 bg-cyan-500/10 scale-110' : 'bg-sky-200 border-slate-700'}
                                group-hover:scale-110 group-hover:border-cyan-400 group-hover:brightness-110`}
                        >
                        <img src={a.img} alt={a.name} className="w-full h-full object-cover" />
                        </div>
                        </div>
                        </button>
                        <p className="text-sm text-white mt-3 whitespace-nowrap">{a.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{a.strokes}</p>
                        </div>
                        );
            })}
            </div>
            
            <button
            onClick={() => setCarouselIndex(prev => prev + 1)}
            className="absolute right-0 z-20 text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-full w-9 h-9 flex items-center justify-center transition-all"
            style={{ fontSize: '22px' }}
            >›</button>
            </div>
            
            <p className="text-xs text-slate-500">Not sure? You can skip and follow athletes later.</p>
            
            <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-sm">Back</button>
            <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="text-slate-400 hover:text-white text-sm">Skip</button>
            <button onClick={() => setStep(3)} className="bg-cyan-500 hover:bg-cyan-400 transition-colors text-white px-4 py-2 rounded">Next</button>
            </div>
            </div>
            </motion.div>
            );
            })()}
          
          {step === 3 && (
            <motion.div key="events" className="space-y-6">
              <div>
                <h2 className="text-xl text-white font-semibold">Follow events</h2>
                <p className="text-sm text-slate-400 mt-2">Stay up to date on the competitions you care about.</p>
              </div>

              <div className="space-y-3">
                {events.map(e => {
                  const selected = selectedEvents.includes(e.id);
                  console.log('EVENT CITY SLUG:', e.city);
                  console.log('POOL KEYS:', Object.keys(POOL_IMAGES));

                  const formatDateRange = (from, to) => {
                    const start = new Date(from);
                    const end = new Date(to);
                    const opts = { month: 'short', day: 'numeric' };
                    if (start.toDateString() === end.toDateString()) {
                      return start.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
                    }
                    return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
                  };

                  const flagUrl = `https://flagcdn.com/24x18/${e.country_code.toLowerCase()}.png`;

                  return (
                    <button
                      key={e.id}
                      onClick={() =>
                        setSelectedEvents(prev =>
                          prev.includes(e.id)
                            ? prev.filter(id => id !== e.id)
                            : [...prev, e.id]
                        )
                      }
                      className={`w-full flex flex-col overflow-hidden rounded-xl border transition-all duration-200
                            ${selected
                              ? 'border-cyan-400 bg-cyan-500/10'
                              : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
                        }`}
                    >
                      <div className="relative w-full h-28">
                        <img
                          src={POOL_IMAGES[e.city] || POOL_IMAGES['Default']}
                          alt={e.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Fade into card */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-slate-900" />
                      </div>
                          
                      <div className="p-4 text-left space-y-2">
                        <p className="text-sm font-medium text-white leading-snug">{e.name}</p>

                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {/* Location */}
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <img src={flagUrl} alt={e.country} className="w-4 h-3 object-cover rounded-sm" />
                            {e.city}, {e.country}
                          </span>

                          {/* Date range */}
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                              <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                            {formatDateRange(e.date_from, e.date_to)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* Competition type badge */}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                            {e.competition_type}
                          </span>
                          {/* Disciplines */}
                          {e.disciplines && e.disciplines.split(',').map(d => (
                            <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-cyan-400">
                              {d.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Checkmark */}
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200
                        ${selected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'}`}
                      >
                        {selected && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(2)} className="text-slate-400 hover:text-white text-sm">
                  Back
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setStep(4)} className="text-slate-400 hover:text-white text-sm">Skip</button>
                  <button onClick={() => setStep(4)} className="bg-cyan-500 hover:bg-cyan-400 transition-colors text-white px-4 py-2 rounded">Next</button>
                </div>
              </div>
            </motion.div>
          )}

        {step === 4 && (
          <motion.div
            key="digest"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="h2">
              <h2 className="text-xl font-semibold text-white">Tell us your name</h2>
              <div className="space-y-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 hover:bg-cyan-900 border border-slate-700 text-white"
                />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white">How often should we update you?</h3>
            <div className="space-y-2">
              {DIGEST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDigestPreference(opt.value)}
                  className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                    digestPreference === opt.value ? 'bg-cyan-500/20 hover:bg-cyan-500/80 hover:text-white text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 border border-slate-700 hover:bg-cyan-900 hover:text-slate-100 text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <button type="button" onClick={() => setStep(3)} className="text-slate-400 hover:text-white text-sm">
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
