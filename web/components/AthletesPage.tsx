//
// AthletesPage.tsx – searchable, filterable, paginated athlete directory.
// Server-side search + pagination so we never load 30k athletes at once.
//

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import {
  Search,
  Users,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import {
  getAthletes,
  getAthleteCountries,
  type Athlete,
  type AthletesResponse,
} from '../src/api/athletes';
import { YourAthletes } from './YourAthletes';

// --- Constants ---

const PAGE_SIZE = 40;
const DEBOUNCE_MS = 300;

// --- Helpers ---

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getPrimaryStroke(strokes?: string | null): string | null {
  if (!strokes) return null;
  return strokes.split(',')[0].trim() || null;
}

// --- Component ---

export function AthletesPage() {
  // Search & filter state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);

  // Data state
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch country pills on mount
  useEffect(() => {
    getAthleteCountries()
      .then(setCountries)
      .catch(() => {}); // non-critical, pills just won't show
  }, []);

  // Fetch athletes when search/filter changes (reset to first page)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAthletes({
      q: debouncedQuery || undefined,
      country: selectedCountry ?? undefined,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((res: AthletesResponse) => {
        if (!cancelled) {
          setAthletes(res.athletes);
          setTotal(res.total);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load athletes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, selectedCountry]);

  // Load more (next page)
  const loadMore = useCallback(() => {
    if (loadingMore || athletes.length >= total) return;
    setLoadingMore(true);

    getAthletes({
      q: debouncedQuery || undefined,
      country: selectedCountry ?? undefined,
      limit: PAGE_SIZE,
      offset: athletes.length,
    })
      .then((res: AthletesResponse) => {
        setAthletes((prev) => [...prev, ...res.athletes]);
        setTotal(res.total);
      })
      .catch(() => {}) // silently fail on load-more; user can retry
      .finally(() => setLoadingMore(false));
  }, [loadingMore, athletes.length, total, debouncedQuery, selectedCountry]);

  const hasMore = athletes.length < total;

  // Auto-focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-light text-white mb-3 tracking-tight"
        >
          Athletes
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 font-light"
        >
          Competitive swimmers from around the world
        </motion.p>
      </div>

      {/* Followed athletes rail (moved here from the home dashboard) */}
      <YourAthletes />

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search athletes by name..."
          className="w-full pl-12 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm font-light focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>

      {/* Country Filter Pills */}
      {countries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          <button
            onClick={() => setSelectedCountry(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCountry === null
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            All
          </button>
          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(selectedCountry === c ? null : c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCountry === c
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {c}
            </button>
          ))}
        </motion.div>
      )}

      {/* Loading State (initial) */}
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
            <p className="text-slate-400 text-sm mb-3">Unable to load athletes.</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                getAthletes({
                  q: debouncedQuery || undefined,
                  country: selectedCountry ?? undefined,
                  limit: PAGE_SIZE,
                  offset: 0,
                })
                  .then((res) => {
                    setAthletes(res.athletes);
                    setTotal(res.total);
                  })
                  .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load athletes'))
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
      {!loading && !error && athletes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {debouncedQuery || selectedCountry
                ? 'No athletes match your search. Try a different name or country.'
                : 'No athletes found. Run the athlete scraper to populate data.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && !error && athletes.length > 0 && (
        <div className="space-y-4">
          {/* Result count */}
          <p className="text-xs text-slate-500 font-light px-1">
            Showing {athletes.length.toLocaleString()} of {total.toLocaleString()} athletes
          </p>

          {/* Athletes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {athletes.map((athlete, i) => (
              <AthleteCard key={athlete.slug} athlete={athlete} index={i} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Athlete Card ---

interface AthleteCardProps {
  athlete: Athlete;
  index: number;
}

function AthleteCard({ athlete, index }: AthleteCardProps) {
  const primaryStroke = getPrimaryStroke(athlete.strokes);

  return (
    <Link to={`/athletes/${athlete.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(0.03 * index, 0.5) }}
      >
        <Card
          animate={false}
          className="hover:border-cyan-500/30 transition-colors cursor-pointer h-full"
        >
          <CardContent className="p-5 flex flex-col items-center text-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-lg">
                {athlete.img ? (
                  <img
                    src={athlete.img}
                    alt={athlete.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-slate-300">
                    {getInitials(athlete.name)}
                  </span>
                )}
              </div>
              {athlete.flag && (
                <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5 text-sm border border-slate-800">
                  {athlete.flag}
                </div>
              )}
            </div>

            {/* Name */}
            <h3 className="font-medium text-slate-200 text-sm leading-tight truncate w-full">
              {athlete.name}
            </h3>

            {/* Country & Stroke */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {athlete.country && (
                <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                  {athlete.country}
                </Badge>
              )}
              {primaryStroke && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {primaryStroke}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
