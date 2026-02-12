//
//  YourAthletes.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Users } from 'lucide-react';
const athletes = [{
  name: 'Léon Marchand',
  country: 'FRA',
  flag: '🇫🇷',
  event: '400m IM',
  initials: 'LM'
}, {
  name: 'Summer McIntosh',
  country: 'CAN',
  flag: '🇨🇦',
  event: '400m Free',
  initials: 'SM'
}, {
  name: 'Katie Ledecky',
  country: 'USA',
  flag: '🇺🇸',
  event: '1500m Free',
  initials: 'KL'
}, {
  name: 'Caeleb Dressel',
  country: 'USA',
  flag: '🇺🇸',
  event: '100m Free',
  initials: 'CD'
}, {
  name: 'Kaylee McKeown',
  country: 'AUS',
  flag: '🇦🇺',
  event: '200m Back',
  initials: 'KM'
}, {
  name: 'David Popovici',
  country: 'ROU',
  flag: '🇷🇴',
  event: '200m Free',
  initials: 'DP'
}];
export function YourAthletes() {
  return <Card delay={0.1} className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          <Users className="h-5 w-5 text-cyan-400" />
          Your Athletes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex gap-6 overflow-x-auto pb-4 pt-2 scrollbar-hide snap-x">
          {athletes.map((athlete, index) => <motion.div key={athlete.name} initial={{
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
                  {athlete.initials}
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
                  {athlete.event}
                </p>
              </div>
            </motion.div>)}

          <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: 0.2 + athletes.length * 0.1
        }} className="flex flex-col items-center gap-2 min-w-[80px] justify-center snap-start cursor-pointer group">
            <div className="h-12 w-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all">
              <span className="text-2xl font-light">+</span>
            </div>
            <p className="text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors">
              Add Athlete
            </p>
          </motion.div>
        </div>
      </CardContent>
    </Card>;
}
