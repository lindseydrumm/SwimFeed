import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Athlete } from '../src/api/athletes';
import { getAthletes } from '../src/api/athletes';
import { FollowButton } from './FollowButton';

type ArticleLike = {
  id?: number | string;
  title: string;
  url?: string | null;
  published_at?: string | null;
  summary?: string | null;
  source?: string | null;
};

interface AthleteInfoBarProps {
  articles: ArticleLike[];
}

type AthleteLike = {
  name: string;
  slug?: string;
  country?: string;
  img?: string;
  image?: string;
  image_url?: string;
  photo?: string;
  photo_url?: string;
  headshot?: string;
  headshot_url?: string;
};

type AthleteNewsMatch = {
  athlete: AthleteLike;
  article: ArticleLike;
};

const fallbackAthletes: AthleteLike[] = [
  {
    name: 'Léon Marchand',
    slug: 'leon-marchand',
    country: 'France',
  },
  {
    name: 'Leon Marchand',
    slug: 'leon-marchand',
    country: 'France',
  },
  {
    name: 'Summer McIntosh',
    slug: 'summer-mcintosh',
    country: 'Canada',
  },
  {
    name: 'Katie Ledecky',
    slug: 'katie-ledecky',
    country: 'United States',
  },
  {
    name: 'Caeleb Dressel',
    slug: 'caeleb-dressel',
    country: 'United States',
  },
];

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeText(value: string | null | undefined): string {
  return stripHtml(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getArticleText(article: ArticleLike): string {
  return normalizeText(`${article.title ?? ''} ${article.summary ?? ''}`);
}

function getAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=0f172a&color=22d3ee&bold=true`;
}

function getAthleteImage(athlete: AthleteLike): string {
  return (
    athlete.img ||
    athlete.image ||
    athlete.image_url ||
    athlete.photo ||
    athlete.photo_url ||
    athlete.headshot ||
    athlete.headshot_url ||
    getAvatarUrl(athlete.name)
  );
}

function uniqueAthletes(athletes: AthleteLike[]): AthleteLike[] {
  const seen = new Set<string>();

  return athletes.filter((athlete) => {
    const key = normalizeText(athlete.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findAthleteMatches(
  articles: ArticleLike[],
  athletes: AthleteLike[]
): AthleteNewsMatch[] {
  const matches: AthleteNewsMatch[] = [];
  const seenAthletes = new Set<string>();

  for (const article of articles) {
    const articleText = getArticleText(article);

    for (const athlete of athletes) {
      const athleteName = normalizeText(athlete.name);
      const nameParts = athleteName.split(' ').filter(Boolean);
      const lastName = nameParts[nameParts.length - 1];

      const fullNameMatches = athleteName && articleText.includes(athleteName);

      const lastNameMatches =
        lastName &&
        lastName.length >= 4 &&
        new RegExp(`\\b${lastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(
          articleText
        );

      const athleteKey = athlete.slug || athleteName;

      if ((fullNameMatches || lastNameMatches) && !seenAthletes.has(athleteKey)) {
        matches.push({ athlete, article });
        seenAthletes.add(athleteKey);
        break;
      }
    }
  }

  return matches;
}

export function AthleteInfoBar({ articles }: AthleteInfoBarProps) {
  const [apiAthletes, setApiAthletes] = useState<AthleteLike[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAthletes() {
      try {
        setLoading(true);

        const response = await getAthletes({ limit: 200 });

        if (!cancelled) {
          setApiAthletes((response.athletes ?? []) as Athlete[]);
        }
      } catch (error) {
        console.error('Failed to load athletes for info bar:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAthletes();

    return () => {
      cancelled = true;
    };
  }, []);

  const allAthletes = useMemo(() => {
    return uniqueAthletes([...apiAthletes, ...fallbackAthletes]);
  }, [apiAthletes]);

  const matches = useMemo(() => {
    return findAthleteMatches(articles, allAthletes).slice(0, 4);
  }, [articles, allAthletes]);

  if (!articles.length) return null;

  if (loading && apiAthletes.length === 0) {
    return (
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-4">
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          <p className="text-sm text-slate-400">Loading featured athletes...</p>
        </div>
      </section>
    );
  }

  if (matches.length === 0) {
    return (
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-4">
        <p className="text-sm text-slate-400">
          No matching athletes found for the latest news yet.
        </p>
      </section>
    );
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
        {matches.map(({ athlete, article }) => {
          const image = getAthleteImage(athlete);
          const hasRealNewsLink = !!article.url && article.url !== '#';
          const profilePath = athlete.slug ? `/athletes/${athlete.slug}` : null;

          return (
            <div
              key={`${athlete.slug || athlete.name}-${article.id}`}
              className="h-full rounded-xl border border-slate-700/70 bg-slate-800/60 p-3 transition-colors hover:border-cyan-500/50 hover:bg-slate-800"
            >
              {/* Athlete identity row: avatar + name link to profile */}
              <div className="flex items-center gap-3">
                {profilePath ? (
                  <Link
                    to={profilePath}
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-500/40 bg-slate-700 transition-transform hover:scale-105"
                    aria-label={`Open ${athlete.name} profile`}
                  >
                    <img
                      src={image}
                      alt={athlete.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-500/40 bg-slate-700">
                    <img
                      src={image}
                      alt={athlete.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {profilePath ? (
                    <Link
                      to={profilePath}
                      className="block truncate font-semibold text-white hover:text-cyan-400 transition-colors"
                    >
                      {athlete.name}
                    </Link>
                  ) : (
                    <h3 className="truncate font-semibold text-white">
                      {athlete.name}
                    </h3>
                  )}
                  <p className="truncate text-xs text-slate-400">
                    {athlete.country || 'Swimmer'}
                  </p>
                </div>
              </div>

              {/* Follow button — only when athlete has a stable id (slug) */}
              {profilePath && (
                <div className="mt-3">
                  <FollowButton
                    entityType="athlete"
                    entityId={athlete.slug as string}
                    name={athlete.name}
                    meta={{ country: athlete.country, img: image }}
                    className="w-full justify-center !py-1.5 text-xs"
                  />
                </div>
              )}

              {/* Article snippet — clickable separately if a real URL exists */}
              {hasRealNewsLink ? (
                <a
                  href={article.url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block group"
                >
                  <p className="line-clamp-2 text-sm font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                    {article.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {stripHtml(article.summary)}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-medium text-cyan-400">
                    <span>Open latest news</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </a>
              ) : (
                <div className="mt-3">
                  <p className="line-clamp-2 text-sm font-medium text-slate-200">
                    {article.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {stripHtml(article.summary)}
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