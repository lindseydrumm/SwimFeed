//
//  UpcomingRaces.tsx
//
//  Fetches upcoming competitions from the backend API and displays
//  the nearest future event as the featured card with a live countdown,
//  followed by additional upcoming events from the database.
//
//  Created by Lindsey Drumm on 2/10/26.
//

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Calendar, Clock, MapPin, ChevronRight, Medal, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getEvents } from '../src/api/events';
import type { SwimEvent } from '../src/types/domain';

// --- Helpers ---

function formatDateRange(from: string | null, to: string | null): string {
  if (!from) return 'Date TBD';
  const start = new Date(from);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  if (!to) return startStr;
  const end = new Date(to);
  if (start.getMonth() === end.getMonth()) {
    return `${startStr} - ${end.getDate()}`;
  }
  return `${startStr} - ${end.toLocaleDateString('en-US', opts)}`;
}

function locationString(event: SwimEvent): string {
  const parts: string[] = [];
  if (event.city) parts.push(event.city);
  if (event.country) parts.push(event.country);
  return parts.join(', ') || 'Location TBD';
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
}

function getCountdown(target: string): Countdown {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

/** How many additional events to show below the featured card. */
const UPCOMING_LIST_COUNT = 3;

export function UpcomingRaces() {
  const [events, setEvents] = useState<SwimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<Countdown>({ days: 0, hours: 0, minutes: 0 });

  // TODO: Select events based on personalisation
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

  // Find future events (already sorted by date_from ASC from the API)
  const now = Date.now();
  const futureEvents = events.filter((e) => e.date_from && new Date(e.date_from).getTime() > now);
  const featured = futureEvents.length > 0 ? futureEvents[0] : null;
  const upcomingList = futureEvents.slice(1, 1 + UPCOMING_LIST_COUNT);

  // Live countdown timer
  useEffect(() => {
    if (!featured?.date_from) return;
    setCountdown(getCountdown(featured.date_from));
    const interval = setInterval(() => {
      setCountdown(getCountdown(featured.date_from!));
    }, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [featured?.date_from]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <Calendar className="h-5 w-5 text-cyan-400" />
        Upcoming Races
      </h2>

      {/* Featured Event */}
      {loading ? (
        <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
          <CardContent className="p-6 sm:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-24 bg-slate-700 rounded" />
              <div className="h-8 w-64 bg-slate-700 rounded" />
              <div className="h-4 w-48 bg-slate-700 rounded" />
            </div>
          </CardContent>
        </Card>
      ) : error || !featured ? (
        <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-800 to-slate-900">
          <CardContent className="p-6 sm:p-8 text-center">
            <AlertCircle className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {error ? 'Unable to load upcoming events.' : 'No upcoming events found.'}
            </p>
            {error && (
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  getEvents()
                    .then(setEvents)
                    .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load events'))
                    .finally(() => setLoading(false));
                }}
                className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 underline"
              >
                Retry
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
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
                    {featured.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm flex-wrap">
                    <MapPin className="h-4 w-4" />
                    <span>{locationString(featured)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span>{formatDateRange(featured.date_from, featured.date_to)}</span>
                    {featured.competition_type && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {featured.competition_type}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={`/events/${featured.id}`}
                    className="text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    View full schedule <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/events/${featured.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
                  >
                    <Medal className="h-4 w-4" />
                    Event details
                  </Link>
                </div>
              </div>

              {featured.date_from && (
                <div className="flex gap-4 z-10 w-full md:w-auto">
                  <div className="flex-1 md:flex-none bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800 min-w-[70px]">
                    <span className="block text-2xl font-bold text-white font-mono">
                      {padTwo(countdown.days)}
                    </span>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Days
                    </span>
                  </div>
                  <div className="flex-1 md:flex-none bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800 min-w-[70px]">
                    <span className="block text-2xl font-bold text-white font-mono">
                      {padTwo(countdown.hours)}
                    </span>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Hours
                    </span>
                  </div>
                  <div className="flex-1 md:flex-none bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800 min-w-[70px]">
                    <span className="block text-2xl font-bold text-white font-mono">
                      {padTwo(countdown.minutes)}
                    </span>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold">
                      Mins
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events List (real data from API) */}
      {!loading && upcomingList.length > 0 && (
        <div className="grid gap-3">
          {upcomingList.map((event, index) => (
            <Link key={event.id ?? event.external_id} to={`/events/${event.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {event.date_from && (
                    <div className="bg-slate-800 rounded-md p-2 text-center min-w-[50px] border border-slate-700 group-hover:border-cyan-500/30 transition-colors">
                      <span className="block text-xs text-slate-400 uppercase font-bold">
                        {new Date(event.date_from).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="block text-lg font-bold text-white">
                        {new Date(event.date_from).getDate()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {event.name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {locationString(event)}
                      </span>
                      {event.competition_type && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                          {event.competition_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 sm:text-right pl-[66px] sm:pl-0">
                  <Clock className="h-4 w-4" />
                  <span>{formatDateRange(event.date_from, event.date_to)}</span>
                </div>
              </motion.div>
            </Link>
          ))}

          {/* Link to full events list */}
          {futureEvents.length > 1 + UPCOMING_LIST_COUNT && (
            <Link
              to="/events"
              className="text-sm text-cyan-400 hover:text-cyan-300 text-center py-2 flex items-center justify-center gap-1 transition-colors"
            >
              View all {futureEvents.length} upcoming events
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
