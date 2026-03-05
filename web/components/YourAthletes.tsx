//
//  YourAthletes.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { useUser } from '../src/store/UserStore';
import { Users } from 'lucide-react';

const fake_athletes = [{
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
  const { state } = useUser();

  const follows = state?.follows;
  const your_athletes = [...(follows?.athletes ?? []).map((e) => ({ ...e, type: 'athlete' as const })),]
  console.log('User State', state)
  console.log('Athletes', state?.follows?.athletes);
  console.log('Your athletes', your_athletes)
  console.log('Follows object:', state?.state?.follows);
    
  return (
    <Card delay={0.1} className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          <Users className="h-5 w-5 text-cyan-400" />
          Your Athletes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
          {your_athletes.length === 0 && (
            <p className="text-slate-500 text-sm">You haven&apos;t followed anyone yet.</p>
          )}
          <div className={`flex gap-6 overflow-x-auto pb-4 pt-2 scrollbar-hide snap-x ${your_athletes.length === 0 ? 'flex-col items-center' : ''}`}>
          {your_athletes.length === 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-2 min-w-[150px] justify-center snap-start cursor-pointer group"
              >
                <NavLink to="/athletes" onClick={() => window.scrollTo(0, 0)}>
                  <button>
                    <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all">
                      <span className="text-2xl font-light">+</span>
                    </div>
                    <p className="text-[12px] text-slate-500 group-hover:text-cyan-400 transition-colors text-center">
                      Add athletes
                    </p>
                  </button>
                </NavLink>
              </motion.div>
            </>
          ) : (
            <>
              {your_athletes.map((athlete, index) => (
                <motion.div
                  key={athlete.id}
                  initial={{opacity: 0, x: 20}}
                  animate={{opacity: 1, x: 0}}
                  transition={{delay: 0.2 + index * 0.1}}
                  className="flex flex-col items-center gap-2 min-w-[150px] snap-start group cursor-pointer"
                >
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-slate-300 group-hover:border-cyan-400 group-hover:text-white transition-all duration-300 shadow-lg group-hover:shadow-cyan-500/20">
                      {athlete.meta?.initials || athlete.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 text-sm border border-slate-800">
                      {athlete.meta?.flag || athlete.meta?.country || '🏊'}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-s font-medium text-slate-200 group-hover:text-cyan-400 transition-colors truncate max-w-[150px]">
                      {athlete.name}
                    </p>
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + your_athletes.length * 0.1 }}
                className="flex flex-col items-center gap-2 min-w-[150px] justify-center snap-start cursor-pointer group"
              >
                <NavLink
                  to="/athletes"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <button>
                    <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all">
                      <span className="text-2xl font-light">+</span>
                    </div>
                    <p className="text-[12px] text-slate-500 group-hover:text-cyan-400 transition-colors text-center">
                      Add athletes
                    </p>
                  </button>
               </NavLink>
             </motion.div>
           </>
         )}
       </div>
     </CardContent>
   </Card>
  );
}
