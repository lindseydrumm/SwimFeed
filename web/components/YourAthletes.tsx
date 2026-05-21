//
//  YourAthletes.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Users } from 'lucide-react';
import { getAthletesBySlug, type Athlete } from '../src/api/athletes';
import { Link } from 'react-router-dom';
import { useUser } from '../src/store/UserStore';

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPrimaryEvent(strokes?: string | null) {
  if (!strokes) return '';
  return strokes.split(',')[0].trim();
}

function followedAthleteIds(state: ReturnType<typeof useUser>['state']): string[] {
  const follows = state?.follows;
  if (follows == null || typeof follows !== 'object') return [];
  const list = 'athletes' in follows ? (follows as { athletes: unknown }).athletes : undefined;
  if (!Array.isArray(list)) return [];
  return list.map((e) => (e && typeof e === 'object' && 'id' in e ? String((e as { id: string }).id) : '')).filter(Boolean);
}

export function YourAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const { state } = useUser();
  const followedSlugs = followedAthleteIds(state);

  useEffect(() => {
    if (followedSlugs.length === 0) {
      setAthletes([]);
      return;
    }
    (async () => {
      try {
        const data = await getAthletesBySlug(followedSlugs);
        setAthletes(data ?? []);
      } catch {
        // If backend is down, keep empty; UI still renders "Add Athlete"
      }
    })();
  }, [followedSlugs.join(',')]);

  return <Card delay={0.1} className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          <Users className="h-5 w-5 text-cyan-400" />
          Your Athletes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex gap-6 overflow-x-auto pb-4 pt-2 scrollbar-hide snap-x">
          {(athletes ?? []).map((athlete, index) => <Link key={athlete.slug ?? athlete.name} to={`/athletes/${athlete.slug ?? 'leon-marchand'}`} className="contents">
            <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: 0.2 + index * 0.1
        }} className="flex flex-col items-center gap-2 min-w-[150px] snap-start group cursor-pointer">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-slate-300 group-hover:border-cyan-400 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-cyan-500/20">
                  {getInitials(athlete.name)}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 text-sm border border-slate-800">
                  {athlete.flag}
                </div>
              </div>
              <div className="text-center">
                <p className="text-s font-medium text-slate-200 group-hover:text-cyan-400 transition-colors truncate max-w-[150px]">
                  {athlete.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate max-w-[100px]">
                  {getPrimaryEvent(athlete.strokes)}
                </p>
              </div>
            </motion.div>
          </Link>)}

          <Link to="/athletes" className="contents">
            <motion.div initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.2 + (athletes?.length ?? 0) * 0.1
          }} className="flex flex-col items-center gap-2 min-w-[80px] justify-center snap-start cursor-pointer group">
              <div className="h-12 w-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all">
                <span className="text-2xl font-light">+</span>
              </div>
              <p className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">
                Add Athlete
              </p>
            </motion.div>
          </Link>
        </div>
      </CardContent>
    </Card>;
}
