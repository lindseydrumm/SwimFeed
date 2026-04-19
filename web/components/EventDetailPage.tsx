//
// EventDetailPage.tsx – detail page for a single competition.
// Hero section is populated from the API. Schedule, broadcast,
// storylines, and featured-swimmers sections remain static placeholders
// until that data is available from the backend.
//

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import {
  MapPin,
  Calendar,
  Trophy,
  ChevronDown,
  Clock,
  Tv,
  Globe,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { FollowButton } from './FollowButton';
import { getEvents } from '../src/api/events';
import type { SwimEvent } from '../src/types/domain';

// --- Static placeholder data (no API equivalent yet) ---

const scheduleData = [
  { day: 'Day 1', date: 'July 14', events: ['100m Freestyle Prelims', '200m Butterfly Prelims', '400m IM Finals'] },
  { day: 'Day 2', date: 'July 15', events: ['100m Backstroke Prelims', '200m Freestyle Finals', '100m Breaststroke Finals'] },
  { day: 'Day 3', date: 'July 16', events: ['50m Freestyle Splash-and-Dash', '4x100m Relay', '1500m Freestyle Finals'] },
];

const broadcastData = [
  { session: 'Morning Heats', time: '10:00 AM AST', localTime: '2:00 AM ET · 7:00 AM GMT', platform: 'Peacock', region: 'US' },
  { session: 'Evening Finals', time: '6:00 PM AST', localTime: '10:00 AM ET · 3:00 PM GMT', platform: 'NBC', region: 'US' },
  { session: 'Full Coverage', time: 'All Sessions', localTime: 'Live & Replay', platform: 'World Aquatics+', region: 'Global' },
];

const featuredSwimmers = [
  { name: 'Katie Ledecky', country: 'USA', context: 'Defending champion in 800m and 1500m freestyle.' },
  { name: 'David Popovici', country: 'ROU', context: 'Current world record holder in 100m freestyle.' },
  { name: 'Ariarne Titmus', country: 'AUS', context: 'Olympic champion looking to defend her titles.' },
  { name: 'Caeleb Dressel', country: 'USA', context: 'Returning to international competition.' },
];

// --- Helpers ---

function formatDateRange(from: string | null, to: string | null): string {
  if (!from) return 'Date TBD';
  const start = new Date(from);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  if (!to) return startStr;
  const end = new Date(to);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startStr} - ${end.toLocaleDateString('en-US', opts)}`;
}

function locationString(event: SwimEvent): string {
  const parts: string[] = [];
  if (event.city) parts.push(event.city);
  if (event.country) parts.push(event.country);
  return parts.join(', ') || 'Location TBD';
}

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<SwimEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (cancelled) return;
        const match = data.find((e) => String(e.id) === id);
        if (match) {
          setEvent(match);
          setError(null);
        } else {
          setError('Event not found');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load event');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 flex justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <p className="text-slate-400">{error ?? 'Event not found'}</p>
        <Link to="/events" className="text-sm text-cyan-400 hover:text-cyan-300 underline">
          Back to events
        </Link>
      </div>
    );
  }

  const eventId = String(event.id ?? event.external_id);

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-12">
      {/* Back link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All events
      </Link>

      {/* Hero Section – populated from API */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          {event.competition_type && (
            <Badge variant="accent" className="mb-4">
              {event.competition_type}
            </Badge>
          )}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight"
        >
          {event.name}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-6 text-slate-400 font-light mb-6"
        >
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
            {formatDateRange(event.date_from, event.date_to)}
          </span>
          <span className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-cyan-400" />
            {locationString(event)}
          </span>
          {event.disciplines && (
            <span className="flex items-center">
              <Trophy className="w-4 h-4 mr-2 text-cyan-400" />
              {event.disciplines}
            </span>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <FollowButton
            entityType="event"
            entityId={eventId}
            name={event.name}
            label="Follow Event"
            followingLabel="Following Event"
          />
        </motion.div>
      </div>

      {/* Broadcast & Start Times (static placeholder) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card className="p-0 overflow-hidden border-cyan-500/30" animate={false}>
          <div className="bg-cyan-600/80 px-6 py-3 flex items-center gap-2">
            <Tv className="w-4 h-4 text-white" />
            <h2 className="text-sm font-medium text-white tracking-wide">
              How to Watch
            </h2>
          </div>
          <div className="divide-y divide-slate-700">
            {broadcastData.map((item, i) => (
              <div
                key={i}
                className="px-6 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-200 text-sm">
                    {item.session}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="text-xs text-slate-400">{item.time}</span>
                    <span className="text-slate-500 text-xs">·</span>
                    <span className="text-xs text-slate-500">{item.localTime}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="accent" className="text-[11px] px-2.5 py-0.5 font-medium">
                    {item.platform}
                  </Badge>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Globe className="w-3 h-3" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                      {item.region}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.section>

      {/* About This Event */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-xl font-light text-white mb-4 px-2">
          About This Event
        </h2>
        <Card animate={false}>
          <CardContent>
            <div className="space-y-4 text-slate-400 font-light leading-relaxed">
              <p>
                {event.name} is a premier international swimming competition
                {event.city && event.country
                  ? ` taking place in ${event.city}, ${event.country}`
                  : event.country
                    ? ` taking place in ${event.country}`
                    : ''
                }
                {event.date_from
                  ? `, scheduled for ${formatDateRange(event.date_from, event.date_to)}`
                  : ''
                }.
              </p>
              {event.competition_type && (
                <p>
                  Competition type: <span className="text-slate-300">{event.competition_type}</span>.
                  {event.disciplines && (
                    <> Disciplines: <span className="text-slate-300">{event.disciplines}</span>.</>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Storylines to Watch (static placeholder) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-xl font-light text-white mb-4 px-2">
          Storylines to Watch
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card animate={false} className="hover:border-cyan-500/30 transition-colors">
            <CardContent className="p-5">
              <h3 className="font-medium text-slate-200 mb-2">
                Ledecky vs. Titmus
              </h3>
              <p className="text-sm text-slate-500 font-light leading-relaxed">
                The distance rivalry continues. Can Titmus defend her 400m title,
                or will Ledecky reclaim her dominance in the middle distance?
              </p>
            </CardContent>
          </Card>
          <Card animate={false} className="hover:border-cyan-500/30 transition-colors">
            <CardContent className="p-5">
              <h3 className="font-medium text-slate-200 mb-2">
                Popovici&apos;s Sprint Dominance
              </h3>
              <p className="text-sm text-slate-500 font-light leading-relaxed">
                After shattering the 100m freestyle world record, all eyes are on
                the young Romanian to see if he can go even faster.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Featured Swimmers (static placeholder) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-xl font-light text-white mb-4 px-2">
          Featured Swimmers
        </h2>
        <div className="space-y-3">
          {featuredSwimmers.map((swimmer, i) => (
            <Card key={i} animate={false} className="hover:border-cyan-500/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-300 shrink-0">
                  {swimmer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-slate-200">{swimmer.name}</h3>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {swimmer.country}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-light">
                    {swimmer.context}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Event Schedule (static placeholder) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-xl font-light text-white mb-4 px-2">
          Event Schedule
        </h2>
        <div className="space-y-3">
          {scheduleData.map((item, index) => (
            <Card
              key={index}
              animate={false}
              className="overflow-hidden cursor-pointer hover:border-cyan-500/30 transition-colors"
              onClick={() => setExpandedDay(expandedDay === index ? null : index)}
            >
              <div className="p-4 flex items-center justify-between bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-medium text-sm">
                    {item.date.split(' ')[1]}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-200">{item.day}</h3>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedDay === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </div>
              <AnimatePresence>
                {expandedDay === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-4 pb-4 pt-0 border-t border-slate-700 bg-slate-800/30">
                      <ul className="space-y-3 mt-4">
                        {item.events.map((ev, i) => (
                          <li
                            key={i}
                            className="flex items-center text-sm text-slate-400"
                          >
                            <Clock className="w-3 h-3 mr-3 text-cyan-400/80" />
                            {ev}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
