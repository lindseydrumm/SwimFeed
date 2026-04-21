import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../src/types/domain';
import { ExternalLink } from 'lucide-react';

type AthleteMatch = {
  name: string;
  slug: string;
  country: string;
  image: string;
};

interface AthleteInfoBarProps {
  article: Article | null;
}

const ATHLETES: AthleteMatch[] = [
  {
    name: 'Katie Ledecky',
    slug: 'katie-ledecky',
    country: 'United States',
    image: '/images/swimmer.png',
  },
  {
    name: 'Caeleb Dressel',
    slug: 'caeleb-dressel',
    country: 'United States',
    image: '/images/swimmer.png',
  },
  {
    name: 'Ariarne Titmus',
    slug: 'ariarne-titmus',
    country: 'Australia',
    image: '/images/swimmer.png',
  },
  {
    name: 'Leon Marchand',
    slug: 'leon-marchand',
    country: 'France',
    image: '/images/swimmer.png',
  },
];

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function findAthleteFromArticle(article: Article | null): AthleteMatch | null {
  if (!article) return null;

  const text = `${article.title ?? ''} ${stripHtml(article.summary)}`.toLowerCase();

  return (
    ATHLETES.find((athlete) => text.includes(athlete.name.toLowerCase())) ?? null
  );
}

export function AthleteInfoBar({ article }: AthleteInfoBarProps) {
  if (!article) return null;

  const athlete = findAthleteFromArticle(article);
  const plainSummary = stripHtml(article.summary);

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <img
            src={athlete?.image ?? '/images/swimmer.png'}
            alt={athlete?.name ?? 'Featured athlete'}
            className="h-16 w-16 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
          />

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-cyan-400 mb-1">
              In the news
            </p>

            <h3 className="text-white text-lg font-semibold truncate">
              {athlete?.name ?? 'Featured swimmer story'}
            </h3>

            <p className="text-sm text-slate-400">
              {athlete?.country ?? 'Athlete match not found yet'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {athlete ? (
            <Link
              to={`/athletes/${athlete.slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              View athlete
            </Link>
          ) : article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
            >
              Read story
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-800/70 p-3">
        <p className="text-sm text-slate-300 line-clamp-2">
          {plainSummary || article.title}
        </p>
      </div>
    </section>
  );
}