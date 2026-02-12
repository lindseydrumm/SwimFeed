//
//  UpcomingRaces.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
const heats = [{
  id: 1,
  event: "Men's 400m IM",
  athlete: 'Léon Marchand',
  date: 'July 27',
  time: '18:00',
  round: 'Final',
  status: 'upcoming'
}, {
  id: 2,
  event: "Women's 400m Free",
  athlete: 'Summer McIntosh',
  date: 'July 27',
  time: '18:45',
  round: 'Final',
  status: 'upcoming'
}, {
  id: 3,
  event: "Women's 1500m Free",
  athlete: 'Katie Ledecky',
  date: 'July 28',
  time: '10:30',
  round: 'Heats',
  status: 'upcoming'
}];
export function UpcomingRaces() {
  return <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Calendar className="h-5 w-5 text-cyan-400" />
        Upcoming Races
      </h2>

      {/* Featured Event */}
      <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4 z-10">
              <Badge variant="accent" className="mb-2">
                Featured Event
              </Badge>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  World Aquatics Championships
                </h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Budapest 2025</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>July 26 - Aug 3</span>
                </div>
              </div>
              <button className="text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                View full schedule <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-4 z-10 w-full md:w-auto">
              <div className="flex-1 md:flex-none bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800 min-w-[70px]">
                <span className="block text-2xl font-bold text-white font-mono">
                  14
                </span>
                <span className="text-[10px] uppercase text-slate-500 font-semibold">
                  Days
                </span>
              </div>
              <div className="flex-1 md:flex-none bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800 min-w-[70px]">
                <span className="block text-2xl font-bold text-white font-mono">
                  08
                </span>
                <span className="text-[10px] uppercase text-slate-500 font-semibold">
                  Hours
                </span>
              </div>
              <div className="flex-1 md:flex-none bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800 min-w-[70px]">
                <span className="block text-2xl font-bold text-white font-mono">
                  42
                </span>
                <span className="text-[10px] uppercase text-slate-500 font-semibold">
                  Mins
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Heats List */}
      <div className="grid gap-3">
        {heats.map((heat, index) => <motion.div key={heat.id} initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2 + index * 0.1
      }} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/60 transition-colors cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="bg-slate-800 rounded-md p-2 text-center min-w-[50px] border border-slate-700 group-hover:border-cyan-500/30 transition-colors">
                <span className="block text-xs text-slate-400 uppercase font-bold">
                  {heat.date.split(' ')[0]}
                </span>
                <span className="block text-lg font-bold text-white">
                  {heat.date.split(' ')[1]}
                </span>
              </div>
              <div>
                <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {heat.event}
                </h4>
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                  <span className="text-slate-300">{heat.athlete}</span>
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                    {heat.round}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 sm:text-right pl-[66px] sm:pl-0">
              <Clock className="h-4 w-4" />
              <span>{heat.time}</span>
            </div>
          </motion.div>)}
      </div>
    </div>;
}
