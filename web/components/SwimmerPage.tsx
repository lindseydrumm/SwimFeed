//
// SwimmerPage.tsx – athlete profile (about, stats, recent results, upcoming races).
// Styled to match project-swim-live (dark theme, Card/Badge from ui).
//

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Trophy, TrendingUp, Clock } from 'lucide-react';
import { FollowButton } from './FollowButton';
import { getAthlete, type Athlete } from '../src/api/athletes';
import { useParams } from 'react-router-dom';

export function SwimmerPage() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const { slug } = useParams();
  const athleteSlug = slug ?? 'leon-marchand';

  useEffect(() => {
    (async () => {
      try {
        const data = await getAthlete(athleteSlug);
        setAthlete(data);
      } catch {
        // fall back to static copy if API fails
      }
    })();
  }, [athleteSlug]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-12">
      {/* Profile Header */}
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center justify-center -z-10 opacity-30 pointer-events-none">
          <div className="w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="w-32 h-32 mx-auto bg-slate-700 rounded-full mb-6 overflow-hidden border-4 border-slate-700 shadow-xl ring-2 ring-cyan-500/30"
        >
          <img
            src="https://images.unsplash.com/photo-1552065327-43675de3d3a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
            alt={athlete?.name ?? 'Athlete profile'}
            className="w-full h-full object-cover"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-light text-white mb-3"
        >
          {athlete?.name ?? 'Michael Phelps'}
        </motion.h1>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-3 mb-6 flex-wrap"
        >
          <Badge variant="accent" className="px-3 py-1 text-sm">
            {athlete?.country ?? 'USA'}
          </Badge>
          {athlete?.strokes
            ? athlete.strokes.split(',').map((stroke) => (
                <Badge key={stroke.trim()} variant="secondary" className="px-3 py-1 text-sm">
                  {stroke.trim()}
                </Badge>
              ))
            : (
              <>
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  Butterfly
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  IM
                </Badge>
              </>
            )}
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <FollowButton
            entityType="athlete"
            entityId={athlete?.slug ?? athleteSlug}
            name={athlete?.name ?? 'Michael Phelps'}
            label="Follow"
            followingLabel="Following"
          />
        </motion.div>

        <div className="h-px max-w-lg mx-auto bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>

      {/* About Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card animate={false}>
          <CardContent className="p-8">
            <h2 className="text-lg font-medium text-white mb-3">About</h2>
            <p className="text-slate-400 font-light leading-relaxed">
              {athlete?.bio
                ?? 'Michael Phelps is the most decorated Olympian of all time, with 28 medals across five Olympic Games. Known for his dominance in butterfly and individual medley events, Phelps redefined what was possible in competitive swimming before retiring after Rio 2016. His legacy continues to inspire the next generation of swimmers worldwide.'}
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: 'Medals', value: athlete?.medals?.toString() ?? '28', icon: Trophy },
          { label: 'World Records', value: athlete?.world_records?.toString() ?? '39', icon: Clock },
          { label: 'World Rank', value: athlete?.world_rank ? `#${athlete.world_rank}` : '#1', icon: TrendingUp },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <Card animate={false} className="p-6 text-center hover:border-cyan-500/30 transition-colors">
              <stat.icon className="w-6 h-6 mx-auto text-cyan-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 font-light uppercase tracking-wide">
                {stat.label}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Results */}
      <section className="space-y-6">
        <div className="px-2">
          <h2 className="text-xl font-light text-white">Recent Results</h2>
          <p className="text-sm text-slate-500 font-light mt-1">
            Career-defining performances from the world&apos;s greatest swimmer.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { event: '200m Butterfly', meet: 'Rio 2016 Olympics', time: '1:53.36', rank: '1st', date: 'Aug 9, 2016' },
            { event: '200m IM', meet: 'Rio 2016 Olympics', time: '1:54.66', rank: '1st', date: 'Aug 11, 2016' },
            { event: '100m Butterfly', meet: 'Rio 2016 Olympics', time: '51.14', rank: '2nd', date: 'Aug 12, 2016' },
          ].map((result, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <Card
                animate={false}
                className="p-5 flex items-center justify-between group hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      result.rank === '1st'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {result.rank === '1st' ? '1' : '2'}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {result.event}
                    </h3>
                    <p className="text-sm text-slate-500">{result.meet}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-medium text-white">
                    {result.time}
                  </div>
                  <div className="text-xs text-slate-500">{result.date}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Upcoming Races */}
      <section className="space-y-6">
        <h2 className="text-xl font-light text-white px-2">
          Upcoming Races
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { event: '200m Butterfly', meet: 'Summer Nationals 2024', date: 'July 15', type: 'Finals' },
            { event: '4x100m Relay', meet: 'Summer Nationals 2024', date: 'July 17', type: 'Prelims' },
          ].map((race, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <Card animate={false} className="p-5 hover:border-cyan-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-200">{race.event}</h3>
                  <Badge variant="outline">{race.type}</Badge>
                </div>
                <p className="text-sm text-slate-500 font-light">
                  {race.meet} — {race.date}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
