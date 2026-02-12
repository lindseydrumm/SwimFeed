//
//  RecentResults.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Trophy, TrendingUp, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
const results = [{
  athlete: 'Léon Marchand',
  event: '200m IM',
  place: 1,
  time: '1:55.22',
  diff: '-0.15',
  date: 'Jun 15'
}, {
  athlete: 'Summer McIntosh',
  event: '200m Fly',
  place: 1,
  time: '2:05.80',
  diff: '+0.40',
  date: 'Jun 14'
}, {
  athlete: 'Caeleb Dressel',
  event: '100m Fly',
  place: 2,
  time: '50.85',
  diff: '+1.20',
  date: 'Jun 14'
}, {
  athlete: 'Katie Ledecky',
  event: '400m Free',
  place: 1,
  time: '3:59.40',
  diff: '+1.10',
  date: 'Jun 12'
}, {
  athlete: 'Kaylee McKeown',
  event: '100m Back',
  place: 1,
  time: '57.60',
  diff: '-0.05',
  date: 'Jun 12'
}];
export function RecentResults() {
  return <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        
        Recent Results
      </h2>

      <Card className="border-slate-800">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {results.map((result, index) => <motion.div key={index} initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.4 + index * 0.1
          }} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border
                    ${result.place === 1 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : result.place === 2 ? 'bg-slate-300/10 text-slate-300 border-slate-300/20' : 'bg-orange-700/10 text-orange-400 border-orange-700/20'}
                  `}>
                    {result.place}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                      {result.athlete}
                    </p>
                    <p className="text-xs text-slate-500">
                      {result.event} • {result.date}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-white">
                    {result.time}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    {result.diff.startsWith('-') ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <Minus className="h-3 w-3 text-slate-500" />}
                    <span className={`text-[10px] ${result.diff.startsWith('-') ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {result.diff}s
                    </span>
                  </div>
                </div>
              </motion.div>)}
          </div>
          <div className="p-3 text-center border-t border-slate-800">
            <button className="text-xs text-slate-500 hover:text-cyan-400 transition-colors font-medium">
              View all results
            </button>
          </div>
        </CardContent>
      </Card>
    </div>;
}