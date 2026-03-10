//
// EventPage.tsx – browsable list of all competitions from the API.
// Each card links to /events/:id for the detail view.
//

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import {
  MapPin,
  Calendar,
  Trophy,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { getEvents } from '../src/api/events';
import type { SwimEvent } from '../src/types/domain';

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

function isUpcoming(event: SwimEvent): boolean {
  if (!event.date_from) return false;
  return new Date(event.date_from).getTime() > Date.now();
}

function isPast(event: SwimEvent): boolean {
  if (!event.date_to && !event.date_from) return false;
  const end = event.date_to ?? event.date_from;
  return new Date(end!).getTime() < Date.now();
}

export function EventPage() {
  const [events, setEvents] = useState<SwimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load events');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const upcoming = events.filter(isUpcoming);
  const past = events.filter(isPast);

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-10">
      {/* Page Header */}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-light text-white mb-3 tracking-tight"
        >
          Events
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 font-light"
        >
          Competitions from World Aquatics
        </motion.p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="border-red-500/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-3">Unable to load events.</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                getEvents()
                  .then(setEvents)
                  .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load events'))
                  .finally(() => setLoading(false));
              }}
              className="text-sm text-cyan-400 hover:text-cyan-300 underline"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              No events found. Run the event scraper to populate data.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {!loading && upcoming.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-light text-white mb-4 px-2 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Upcoming
            <Badge variant="accent" className="text-[10px] px-2 py-0.5">
              {upcoming.length}
            </Badge>
          </h2>
          <div className="space-y-3">
            {upcoming.map((event, i) => (
              <EventCard key={event.id ?? event.external_id} event={event} index={i} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Past Events */}
      {!loading && past.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-light text-white mb-4 px-2 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-slate-500" />
            Past Events
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              {past.length}
            </Badge>
          </h2>
          <div className="space-y-3">
            {past.map((event, i) => (
              <EventCard key={event.id ?? event.external_id} event={event} index={i} dimmed />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

// --- Event Card ---

interface EventCardProps {
  event: SwimEvent;
  index: number;
  dimmed?: boolean;
}

function EventCard({ event, index, dimmed }: EventCardProps) {
  return (
    <Link to={`/events/${event.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 * index }}
      >
        <Card
          animate={false}
          className={`hover:border-cyan-500/30 transition-colors cursor-pointer ${dimmed ? 'opacity-60' : ''}`}
        >
          <CardContent className="p-5 flex items-center gap-4">
            {/* Date badge */}
            {event.date_from && (
              <div className="w-14 h-14 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center text-cyan-400 shrink-0">
                <span className="text-[10px] uppercase font-semibold leading-none">
                  {new Date(event.date_from).toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {new Date(event.date_from).getDate()}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-200 mb-1 truncate">{event.name}</h3>
              <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {locationString(event)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateRange(event.date_from, event.date_to)}
                </span>
              </div>
              {(event.competition_type || event.disciplines) && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {event.competition_type && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {event.competition_type}
                    </Badge>
                  )}
                  {event.disciplines && (
                    <span className="text-[10px] text-slate-600">
                      {event.disciplines}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
