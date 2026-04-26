import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../src/types/domain';
import type { Athlete } from '../src/api/athletes';
import { getAthletes } from '../src/api/athletes';
import { ExternalLink, Medal, Trophy, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AthleteInfoBarProps {
  article: Article | null;
}

// Helper: Strip HTML tags from string
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Extract potential athlete names from article title and summary
function extractPotentialAthleteNames(article: Article | null): string[] {
  if (!article) return [];
  
  const text = `${article.title ?? ''} ${stripHtml(article.summary)}`.toLowerCase();
  
  // Common swimmer name patterns
  const patterns = [
    // Full name pattern (Katie Ledecky, Caeleb Dressel)
    /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g,
    // Last name pattern (Ledecky, Dressel)
    /\b([A-Z][a-z]{3,})\b/g,
  ];
  
  const matches = new Set<string>();
  for (const pattern of patterns) {
    const matches_iter = text.matchAll(pattern);
    for (const match of matches_iter) {
      matches.add(match[1].toLowerCase());
    }
  }
  
  return Array.from(matches);
}

export function AthleteInfoBar({ article }: AthleteInfoBarProps) {
  const [matchedAthlete, setMatchedAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(false);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);

  // Pre-load athletes data from API
  useEffect(() => {
    if (allAthletes.length === 0) {
      setLoading(true);
      getAthletes({ limit: 100 })
        .then((response) => {
          setAllAthletes(response.athletes);
        })
        .catch((error) => {
          console.error('Failed to load athletes:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  // Match athlete when article changes
  useEffect(() => {
    if (!article || allAthletes.length === 0) {
      setMatchedAthlete(null);
      return;
    }

    const potentialNames = extractPotentialAthleteNames(article);
    
    // Find best matching athlete
    let bestMatch: Athlete | null = null;
    let bestMatchScore = 0;

    for (const athlete of allAthletes) {
      const athleteNameLower = athlete.name.toLowerCase();
      let score = 0;
      
      // Exact match
      if (potentialNames.includes(athleteNameLower)) {
        score = 3;
      }
      // Partial match
      else if (potentialNames.some(name => athleteNameLower.includes(name) || name.includes(athleteNameLower))) {
        score = 2;
      }
      // Direct name mention in article text
      else {
        const articleText = `${article.title ?? ''} ${stripHtml(article.summary)}`.toLowerCase();
        if (articleText.includes(athleteNameLower)) {
          score = 1;
        }
      }
      
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = athlete;
      }
    }

    setMatchedAthlete(bestMatch);
  }, [article, allAthletes]);

  // Don't render if no article
  if (!article) return null;

  const plainSummary = stripHtml(article.summary);

  // Loading state
  if (loading && allAthletes.length === 0) {
    return (
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-4 md:p-5"
      >
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
          <p className="text-slate-400">Loading athlete data...</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900/90 to-slate-900/60 p-4 md:p-5 hover:border-cyan-500/40 transition-all duration-300"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Athlete avatar and basic info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Avatar with fallback image */}
          <div className="relative shrink-0">
            <img
              src={matchedAthlete?.img ?? '/images/swimmer.png'}
              alt={matchedAthlete?.name ?? 'Featured athlete'}
              className="h-16 w-16 rounded-full object-cover border-2 border-cyan-500/50 bg-slate-800 shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/swimmer.png';
              }}
            />
            {/* Online indicator dot */}
            {matchedAthlete && (
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            {/* Badge row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-xs uppercase tracking-wide text-cyan-400 font-medium">
                {matchedAthlete ? 'IN THE NEWS' : 'LATEST STORY'}
              </p>
              {/* Medal count badge */}
              {matchedAthlete?.medals && matchedAthlete.medals > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Medal className="h-3 w-3" />
                  {matchedAthlete.medals} medals
                </span>
              )}
              {/* World record badge */}
              {matchedAthlete?.world_records && matchedAthlete.world_records > 0 && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {matchedAthlete.world_records} WR
                </span>
              )}
            </div>

            {/* Athlete name */}
            <h3 className="text-white text-lg font-semibold truncate">
              {matchedAthlete?.name ?? 'Featured Swimmer Story'}
            </h3>

            {/* Country and rank info */}
            <p className="text-sm text-slate-400 flex items-center gap-2">
              {matchedAthlete?.country ?? 'Athlete match in progress...'}
              {matchedAthlete?.world_rank && (
                <>
                  <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                  <span>World Rank #{matchedAthlete.world_rank}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 shrink-0">
          {matchedAthlete ? (
            <Link
              to={`/athletes/${matchedAthlete.slug}`}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 hover:border-cyan-500/50 transition-all duration-200 group"
            >
              View Athlete Profile
              <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all duration-200"
            >
              Read Full Story
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>

      {/* Article summary preview */}
      <div className="mt-4 rounded-xl bg-slate-800/50 p-3 border border-slate-700/30">
        <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
          {plainSummary || article.title}
        </p>
      </div>
    </motion.section>
  );
}