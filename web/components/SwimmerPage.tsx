//
// SwimmerPage.tsx – athlete profile (about, stats, personal bests, medals).
// Styled to match project-swim-live (dark theme, Card/Badge from ui).
//

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Trophy, Medal, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { FollowButton } from './FollowButton';
import {
  getAthlete,
  getAthletePersonalBests,
  scrapeAthleteDetail,
  type Athlete,
  type PersonalBest,
} from '../src/api/athletes';
import { useParams } from 'react-router-dom';

export function SwimmerPage() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapingDetail, setScrapingDetail] = useState(false);
  const { slug } = useParams();
  const athleteSlug = slug ?? 'leon-marchand';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getAthlete(athleteSlug);
        if (cancelled) return;
        setAthlete(data);

        // If detail hasn't been scraped yet, trigger on-demand scrape
        if (!data.detail_scraped_at) {
          setScrapingDetail(true);
          try {
            const result = await scrapeAthleteDetail(athleteSlug);
            if (cancelled) return;
            setAthlete(result.athlete);
            setPersonalBests(result.personal_bests);
          } catch {
            // Scrape failed — show what we have
          } finally {
            if (!cancelled) setScrapingDetail(false);
          }
        } else {
          // Detail already scraped — fetch personal bests
          try {
            const pbs = await getAthletePersonalBests(athleteSlug);
            if (!cancelled) setPersonalBests(pbs);
          } catch {
            // PBs fetch failed — leave empty
          }
        }
      } catch {
        // Athlete fetch failed entirely
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [athleteSlug]);

  if (loading && !athlete) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-slate-400">Athlete not found.</p>
      </div>
    );
  }

  const totalMedals = (athlete.gold_medals || 0) + (athlete.silver_medals || 0) + (athlete.bronze_medals || 0);
  const hasMedals = totalMedals > 0;

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
          className="w-32 h-32 mx-auto bg-slate-700 rounded-full mb-6 overflow-hidden border-4 border-slate-700 shadow-xl ring-2 ring-cyan-500/30 flex items-center justify-center"
        >
          {athlete.img ? (
            <img
              src={athlete.img}
              alt={athlete.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-slate-300">
              {athlete.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          )}
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-light text-white mb-3"
        >
          {athlete.name}
        </motion.h1>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-3 mb-6 flex-wrap"
        >
          {athlete.country && (
            <Badge variant="accent" className="px-3 py-1 text-sm">
              {athlete.flag ? `${athlete.flag} ` : ''}{athlete.country}
            </Badge>
          )}
          {athlete.discipline && (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {athlete.discipline}
            </Badge>
          )}
          {athlete.strokes
            ? athlete.strokes.split(',').map((stroke) => (
                <Badge key={stroke.trim()} variant="secondary" className="px-3 py-1 text-sm">
                  {stroke.trim()}
                </Badge>
              ))
            : null}
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <FollowButton
            entityType="athlete"
            entityId={athlete.slug}
            name={athlete.name}
            label="Follow"
            followingLabel="Following"
          />
        </motion.div>

        <div className="h-px max-w-lg mx-auto bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </div>

      {/* About Section */}
      {athlete.bio && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card animate={false}>
            <CardContent className="p-8">
              <h2 className="text-lg font-medium text-white mb-3">About</h2>
              <p className="text-slate-400 font-light leading-relaxed">
                {athlete.bio}
              </p>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Medal Breakdown */}
      {hasMedals ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: 'Gold', value: athlete.gold_medals || 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Silver', value: athlete.silver_medals || 0, color: 'text-slate-300', bg: 'bg-slate-500/10' },
            { label: 'Bronze', value: athlete.bronze_medals || 0, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          ].map((medal, i) => (
            <motion.div
              key={medal.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <Card animate={false} className="p-6 text-center hover:border-cyan-500/30 transition-colors">
                <Medal className={`w-6 h-6 mx-auto ${medal.color} mb-3`} />
                <div className="text-3xl font-bold text-white mb-1">
                  {medal.value}
                </div>
                <div className="text-sm text-slate-500 font-light uppercase tracking-wide">
                  {medal.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Fallback stats when no medal data */
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: 'Total Medals', value: athlete.medals?.toString() ?? '-', icon: Trophy },
            { label: 'World Records', value: athlete.world_records?.toString() ?? '-', icon: Clock },
            { label: 'World Rank', value: athlete.world_rank ? `#${athlete.world_rank}` : '-', icon: TrendingUp },
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
      )}

      {/* Personal Best Results */}
      <section className="space-y-6">
        <div className="px-2">
          <h2 className="text-xl font-light text-white">Personal Best Results</h2>
          {scrapingDetail && (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-sm text-slate-500">Loading athlete details...</span>
            </div>
          )}
        </div>

        {personalBests.length > 0 ? (
          <div className="space-y-3">
            {personalBests.map((pb, i) => (
              <motion.div
                key={`${pb.event}-${pb.pool_length}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
              >
                <Card
                  animate={false}
                  className="p-5 flex items-center justify-between group hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${
                        pb.medal === 'gold'
                          ? 'bg-amber-500/20 text-amber-400'
                          : pb.medal === 'silver'
                          ? 'bg-slate-500/20 text-slate-300'
                          : pb.medal === 'bronze'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {pb.pool_length ?? ''}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                        {pb.event}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {pb.competition}
                        {pb.comp_country ? ` (${pb.comp_country})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono font-medium text-white">
                      {pb.time}
                    </div>
                    <div className="text-xs text-slate-500">{pb.result_date}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : !scrapingDetail ? (
          <Card animate={false} className="p-8 text-center">
            <p className="text-slate-500 font-light">No personal best results available yet.</p>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
