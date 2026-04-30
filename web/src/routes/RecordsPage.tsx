import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getRankings, getRecords, type Ranking, type Record as WRecord } from '../api/rankings';
import { getAthletesByExtIds, type AthleteSlugMapping } from '../api/athletes';

// ── constants ────────────────────────────────────────────────────────
const STROKE_ORDER = ['FREESTYLE', 'BACKSTROKE', 'BREASTSTROKE', 'BUTTERFLY', 'MEDLEY'] as const;
const STROKE_LABELS: Record<string, string> = {
  FREESTYLE: 'Freestyle',
  BACKSTROKE: 'Backstroke',
  BREASTSTROKE: 'Breaststroke',
  BUTTERFLY: 'Butterfly',
  MEDLEY: 'Individual Medley',
};

function eventLabel(distance: number, stroke: string): string {
  return `${distance}m ${STROKE_LABELS[stroke] ?? stroke}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Order records by stroke group then distance. */
function orderByEvent<T extends { stroke: string; distance: number }>(items: T[]): T[] {
  const strokeIdx = Object.fromEntries(STROKE_ORDER.map((s, i) => [s, i]));
  return [...items].sort(
    (a, b) => (strokeIdx[a.stroke] ?? 99) - (strokeIdx[b.stroke] ?? 99) || a.distance - b.distance,
  );
}

// ── athlete link ─────────────────────────────────────────────────────
function AthleteLink({
  name,
  extId,
  slugMap,
}: {
  name: string;
  extId: number;
  slugMap: Map<number, AthleteSlugMapping>;
}) {
  const mapping = slugMap.get(extId);
  if (mapping) {
    return (
      <Link
        to={`/athletes/${mapping.slug}`}
        className="text-white font-medium hover:text-cyan-400 transition-colors"
      >
        {name}
      </Link>
    );
  }
  return <span className="text-white font-medium">{name}</span>;
}

// ── ranking sub-row ──────────────────────────────────────────────────
function RankingRow({
  r,
  index,
  slugMap,
}: {
  r: Ranking;
  index: number;
  slugMap: Map<number, AthleteSlugMapping>;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ delay: index * 0.02 }}
      className="hover:bg-slate-700/30 transition-colors"
    >
      <td className="px-6 py-3 text-slate-400 text-sm font-mono w-12 text-center">{r.rank}</td>
      <td className="px-6 py-3">
        <span className="text-cyan-400 font-mono">{r.time}</span>
      </td>
      <td className="px-6 py-3">
        <AthleteLink name={r.athlete_name} extId={r.athlete_ext_id} slugMap={slugMap} />
        {r.country_code && <span className="ml-2 text-slate-500 text-sm">{r.country_code}</span>}
      </td>
      <td className="px-6 py-3 text-slate-400 text-sm">{formatDate(r.result_date)}</td>
      <td className="px-6 py-3 text-slate-400 text-sm">{r.event_name ?? '—'}</td>
    </motion.tr>
  );
}

// ── event row (record + expandable top-10) ───────────────────────────
function EventRow({
  record,
  rankings,
  slugMap,
}: {
  record: WRecord;
  rankings: Ranking[];
  slugMap: Map<number, AthleteSlugMapping>;
}) {
  const [open, setOpen] = useState(false);
  const label = eventLabel(record.distance, record.stroke);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hover:bg-slate-700/50 transition-colors cursor-pointer group"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {rankings.length > 0 ? (
              open ? (
                <ChevronUp className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
              )
            ) : (
              <div className="w-4" />
            )}
            <span className="text-white font-medium">{label}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-amber-400 font-mono text-lg">{record.time}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <AthleteLink name={record.athlete_name} extId={record.athlete_ext_id} slugMap={slugMap} />
          {record.country_code && (
            <span className="ml-2 text-slate-500 text-sm">{record.country_code}</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm">
          {formatDate(record.result_date)}
        </td>
        <td className="px-6 py-4 text-slate-300 text-sm">{record.event_city ?? '—'}</td>
      </motion.tr>

      <AnimatePresence>
        {open && rankings.length > 0 && (
          <tr>
            <td colSpan={5} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="border-y border-slate-700/50">
                  <div className="px-6 py-2 bg-slate-900/60">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      All-Time Top {rankings.length} — {label}
                    </span>
                  </div>
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-700/30">
                      {rankings.map((r, i) => (
                        <RankingRow key={r.id} r={r} index={i} slugMap={slugMap} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ── page ──────────────────────────────────────────────────────────────
export function RecordsPage() {
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [pool, setPool] = useState<'LCM' | 'SCM'>('LCM');
  const [rankingType, setRankingType] = useState<'alltime' | 'current'>('alltime');
  const [searchTerm, setSearchTerm] = useState('');

  const [records, setRecords] = useState<WRecord[]>([]);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [slugMap, setSlugMap] = useState<Map<number, AthleteSlugMapping>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch records + rankings + slug mappings whenever filters change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [rec, rank] = await Promise.all([
          getRecords({ gender, pool }),
          getRankings({ gender, pool, ranking_type: rankingType }),
        ]);
        if (cancelled) return;
        setRecords(rec);
        setRankings(rank);

        // Collect all unique athlete external_ids and batch-resolve slugs
        const extIds = new Set<number>();
        for (const r of rec) extIds.add(r.athlete_ext_id);
        for (const r of rank) extIds.add(r.athlete_ext_id);

        if (extIds.size > 0) {
          const mappings = await getAthletesByExtIds([...extIds]);
          if (!cancelled) {
            const map = new Map<number, AthleteSlugMapping>();
            for (const m of mappings) map.set(m.external_id, m);
            setSlugMap(map);
          }
        }
      } catch (err) {
        console.error('Failed to fetch records/rankings', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gender, pool, rankingType]);

  // Group rankings by event key
  const rankingsByEvent = useMemo(() => {
    const map = new Map<string, Ranking[]>();
    for (const r of rankings) {
      const key = `${r.stroke}-${r.distance}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.rank - b.rank);
    return map;
  }, [rankings]);

  const orderedRecords = useMemo(() => orderByEvent(records), [records]);

  const filtered = useMemo(() => {
    if (!searchTerm) return orderedRecords;
    const q = searchTerm.toLowerCase();
    return orderedRecords.filter(
      (r) =>
        eventLabel(r.distance, r.stroke).toLowerCase().includes(q) ||
        r.athlete_name.toLowerCase().includes(q) ||
        (r.country_code ?? '').toLowerCase().includes(q),
    );
  }, [orderedRecords, searchTerm]);

  const genderLabel = gender === 'M' ? "Men's" : "Women's";
  const poolLabel = pool === 'LCM' ? 'Long Course (50m)' : 'Short Course (25m)';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-amber-400" />
          <h1 className="text-3xl font-bold text-white">World Records</h1>
        </div>
        <p className="text-slate-400">
          {genderLabel} {poolLabel} world records — click any row to see the all-time top 10
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['M', 'F'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                gender === g
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {g === 'M' ? "Men's" : "Women's"}
            </button>
          ))}

          <div className="w-px bg-slate-700 mx-1 hidden sm:block" />

          {(['LCM', 'SCM'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPool(p)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                pool === p
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {p === 'LCM' ? '50m' : '25m'}
            </button>
          ))}

          <div className="w-px bg-slate-700 mx-1 hidden sm:block" />

          {(['alltime', 'current'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setRankingType(t)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                rankingType === t
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {t === 'alltime' ? 'All-Time' : new Date().getFullYear().toString()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search events, athletes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-slate-400">Loading records...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Trophy className="h-12 w-12 mb-4 opacity-50" />
          <p>
            No records found
            {searchTerm ? ' matching your search' : ' — run the rankings scraper first'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Athlete
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filtered.map((record) => {
                  const eventKey = `${record.stroke}-${record.distance}`;
                  return (
                    <EventRow
                      key={eventKey}
                      record={record}
                      rankings={rankingsByEvent.get(eventKey) ?? []}
                      slugMap={slugMap}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-slate-500">
        <p>
          Data from World Aquatics rankings API
          {rankingType === 'current' && ` — ${new Date().getFullYear()} season`}
        </p>
      </div>
    </div>
  );
}
