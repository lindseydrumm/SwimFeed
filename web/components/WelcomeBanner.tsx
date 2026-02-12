//
//  WelcomeBanner.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
export function WelcomeBanner() {
  return <motion.div initial={{
    opacity: 0,
    y: -20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }} className="w-full py-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Welcome back, Jordan
          </h1>
          <p className="text-slate-400 text-sm md:text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>
              You're following{' '}
              <span className="text-cyan-400 font-semibold">5 athletes</span>{' '}
              and have{' '}
              <span className="text-cyan-400 font-semibold">
                2 upcoming races
              </span>{' '}
              this week.
            </span>
          </p>
        </div>
        
      </div>
    </motion.div>;
}