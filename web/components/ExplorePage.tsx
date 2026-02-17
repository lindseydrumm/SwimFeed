//
// ExplorePage.tsx – explore stories, techniques, and culture of swimming.
// Styled to match project-swim-live (dark theme, Card/Badge from ui).
//

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Search } from 'lucide-react';

const categories = [
  'Technique',
  'Nutrition',
  'Training',
  'Gear',
  'Mental Game',
  'History',
];

const articles = [
  { title: 'The Science of the Perfect Start', category: 'Technique', imageId: '1534438327276-14e5300c3a48' },
  { title: 'Recovery Nutrition for Swimmers', category: 'Nutrition', imageId: '1541535648570-3c2b9a5142a0' },
  { title: 'Building Mental Toughness in the Pool', category: 'Mental Game', imageId: '1571019614242-5b2c2c1700b0' },
  { title: 'A History of the 100m Freestyle', category: 'History', imageId: '1560174038-da43ac74f01b' },
  { title: 'Choosing the Right Racing Suit', category: 'Gear', imageId: '1560174038-da43ac74f01b' },
  { title: 'Periodization: Planning Your Season', category: 'Training', imageId: '1534438327276-14e5300c3a48' },
];

export function ExplorePage() {
  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-10 text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-light text-white mb-2">
          Explore the Water
        </h1>
        <p className="text-slate-400 font-light mb-8">
          Dive into stories, techniques, and the culture of competitive
          swimming.
        </p>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for swimmers, events, or tips..."
            className="w-full pl-12 pr-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((cat, i) => (
          <motion.button
            key={cat}
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
          >
            {cat}
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            <Card
              animate={false}
              className="h-64 relative group overflow-hidden hover:border-cyan-500/30 transition-colors cursor-pointer"
            >
              <img
                src={`https://images.unsplash.com/photo-${article.imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80`}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <Badge
                  variant="outline"
                  className="text-slate-200 border-white/30 bg-slate-900/50 backdrop-blur-sm mb-2"
                >
                  {article.category}
                </Badge>
                <h3 className="text-white font-medium text-lg leading-tight">
                  {article.title}
                </h3>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
