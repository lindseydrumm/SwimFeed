/**
 * AthleteInfoBar — "Athletes in the news" rail on the home page.
 *
 * Data source: GET /articles/featured-athletes, which is driven by the
 * article_athletes join table populated from RSS <category> tags at ingest.
 * No more client-side name scanning.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFeaturedAthletes, type FeaturedAthlete } from '../src/api/articles';
import { FollowButton } from './FollowButton';

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function AthleteInfoBar() {
  const [featured, setFeatured] = useState<FeaturedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFeaturedAthletes(4)
      .then((data) => {
        if (!cancelled) {
          setFeatured(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load featured athletes');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-4">
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-400">Loading featured athletes...</p>
        </div>
      </section>
    );
  }

  if (error || featured.length === 0) {
    // Honest: no tagged news, no section.
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4"
    >
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
          Athletes in the news
        </p>
        <h2 className="text-lg font-semibold text-white">
          Featured from latest stories
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {featured.map((fa) => {
          const hasRealNewsLink = !!fa.url && fa.url !== '#';
          const profilePath = fa.slug ? `/athletes/${fa.slug}` : null;


          return (
            <div
              key={`${fa.athlete_id}-${fa.article_id}`}
              className="h-full rounded-xl border border-slate-700/70 bg-slate-800/60 p-3 transition-colors hover:border-cyan-500/50 hover:bg-slate-800"
            >
              {/* Athlete identity row: avatar + name link to profile */}
              <div className="flex items-center gap-3">
                {profilePath ? (
                  <Link
                    to={profilePath}
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-500/40 bg-slate-700 transition-transform hover:scale-105"
                    aria-label={`Open ${fa.name} profile`}
                  >
                    {fa.img ? (
                      <img
                        src={fa.img}
                        alt={fa.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-300">
                        {getInitials(fa.name)}
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-500/40 bg-slate-700">
                    {fa.img ? (
                      <img
                        src={fa.img}
                        alt={fa.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-300">
                        {getInitials(fa.name)}
                      </span>
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {profilePath ? (
                    <Link
                      to={profilePath}
                      className="block truncate font-semibold text-white hover:text-cyan-400 transition-colors"
                    >
                      {fa.name}
                    </Link>
                  ) : (
                    <h3 className="truncate font-semibold text-white">
                      {fa.name}
                    </h3>
                  )}
                    <p className="truncate text-xs text-slate-400">
                      {fa.country || 'Swimmer'}
                    </p>
                </div>
              </div>

              {/* Follow button */}
              {profilePath && (
                <div className="mt-3">
                  <FollowButton
                    entityType="athlete"
                    entityId={fa.slug}
                    name={fa.name}
                    meta={{ country: fa.country, img: fa.img }}
                    className="w-full justify-center !py-1.5 text-xs"
                  />
                </div>
              )}

              {/* Article snippet */}
              {hasRealNewsLink ? (
                <a
                  href={fa.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block group"
                >
                  <p className="line-clamp-2 text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {fa.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {stripHtml(fa.summary)}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-cyan-400">
                    <span>Open latest news</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </a>
              ) : (
                <div className="mt-3">
                  <p className="line-clamp-2 text-sm font-medium text-slate-200">
                    {fa.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {stripHtml(fa.summary)}
                  </p>
                  <div className="mt-2 text-xs font-medium text-cyan-400">
                    Latest matching news
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
