//
//  AthletesToWatch.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Activity, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { motion } from 'framer-motion';
const athletes = [{
  name: 'Léon Marchand',
  country: 'FRA',
  event: '400m IM',
  pb: '4:02.50',
  wr: '4:02.50',
  trend: 'up',
  data: [{
    val: 410
  }, {
    val: 408
  }, {
    val: 406
  }, {
    val: 404
  }, {
    val: 402.5
  }]
}, {
  name: 'Summer McIntosh',
  country: 'CAN',
  event: '400m Free',
  pb: '3:56.08',
  wr: '3:55.38',
  trend: 'up',
  data: [{
    val: 402
  }, {
    val: 400
  }, {
    val: 398
  }, {
    val: 397
  }, {
    val: 396
  }]
}, {
  name: 'David Popovici',
  country: 'ROU',
  event: '100m Free',
  pb: '46.86',
  wr: '46.40',
  trend: 'stable',
  data: [{
    val: 47.5
  }, {
    val: 47.2
  }, {
    val: 47.0
  }, {
    val: 46.9
  }, {
    val: 46.86
  }]
}, {
  name: 'Kate Douglass',
  country: 'USA',
  event: '200m Breast',
  pb: '2:19.30',
  wr: '2:17.55',
  trend: 'up',
  data: [{
    val: 145
  }, {
    val: 143
  }, {
    val: 142
  }, {
    val: 140
  }, {
    val: 139.3
  }]
}];
export function AthletesToWatch() {
  return <Card delay={0.3}>
      <CardHeader>
        <CardTitle>
          <Activity className="h-5 w-5 text-cyan-400" />
          Athletes to Watch
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {athletes.map((athlete, index) => <motion.div key={athlete.name} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4 + index * 0.1
        }} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 border-2 border-slate-600 group-hover:border-cyan-400 transition-colors">
                    {athlete.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {athlete.name}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">
                        {athlete.country}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                      <span className="text-xs text-cyan-400">
                        {athlete.event}
                      </span>
                    </div>
                  </div>
                </div>
                {athlete.pb === athlete.wr && <Badge variant="warning" className="text-[10px]">
                    WR Holder
                  </Badge>}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">
                    Personal Best
                  </p>
                  <p className="text-lg font-mono font-bold text-white">
                    {athlete.pb}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">
                    World Record
                  </p>
                  <p className="text-lg font-mono font-bold text-slate-400">
                    {athlete.wr}
                  </p>
                </div>
              </div>

              <div className="h-16 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={athlete.data}>
                    <Line type="monotone" dataKey="val" stroke="#00D4FF" strokeWidth={2} dot={false} isAnimationActive={true} />
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>Improving trend</span>
              </div>
            </motion.div>)}
        </div>
      </CardContent>
    </Card>;
}