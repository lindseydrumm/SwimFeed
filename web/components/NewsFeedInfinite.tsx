/**
 * NewsFeedInfinite — full-width news feed with debounced search, topic tag
 * filter, and IntersectionObserver-driven infinite scroll. The header
 * (search + tags) hides on scroll-down and reappears on scroll-up.
 *
 * Backend: GET /articles?q=&topic=&cursor=&limit= → { articles, next_cursor }
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Clock, ExternalLink, Loader2, AlertCircle, Newspaper } from 'lucide-react';

import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { ArticleActions } from './ArticleActions';
import { useUser } from '../src/store/UserStore';
import { useGuestGate } from '../src/hooks/useGuestGate';
import { useScrollDirection } from '../src/hooks/useScrollDirection';
import {
  getArticlesPage,
  ARTICLE_TOPICS,
  type Article,
} from '../src/api/articles';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;
// Header height (Header.tsx uses h-16 = 64px)
const HEADER_OFFSET_PX = 64;

// --- Helpers ---

function getPlainText(html?: string | null): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function getImageSrc(html?: string | null): string | null {
  if (!html) return null;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const img = tmp.querySelector('img');
  return img ? img.src : null;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

// --- Component ---

interface NewsFeedInfiniteProps {
  /**
   * Called whenever the loaded article list changes. Kept for callers that
   * want to observe the current feed contents (e.g. analytics, sidebars).
   */
  onArticlesChange?: (articles: Article[]) => void;
  /**
   * When set, forces the feed to filter by this query string and hides
   * the search input + topic pills. Used by the event detail page to
   * scope news to a single event.
   */
  fixedQuery?: string;
  /**
   * Override for the section heading. `undefined` (default) renders
   * "Latest News". Pass an empty string to hide the heading entirely.
   */
  title?: string;
  /**
   * Custom empty-state copy. Falls back to a generic message.
   */
  emptyMessage?: string;
}

export function NewsFeedInfinite({
  onArticlesChange,
  fixedQuery,
  title,
  emptyMessage,
}: NewsFeedInfiniteProps = {}) {
  const isLocked = fixedQuery !== undefined;
  // Search & filter state
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Data state
  const [articles, setArticles] = useState<Article[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { markSeen, isSeen } = useUser();
  const { requireAuth } = useGuestGate();
  const { hidden: scrollHidden } = useScrollDirection();

  // Track current request so out-of-order responses don't overwrite fresh state.
  const requestIdRef = useRef(0);

  // Notify parent whenever the article list updates.
  useEffect(() => {
    onArticlesChange?.(articles);
  }, [articles, onArticlesChange]);

  // The sticky header should only auto-hide *after* the user has actually
  // scrolled past it (i.e. it's pinned). Until then, keep it visible so the
  // user actually sees the search bar on first scroll-through.
  const pinSentinelRef = useRef<HTMLDivElement | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  useEffect(() => {
    const node = pinSentinelRef.current;
    if (!node) return;
    // Sentinel sits above the sticky bar. When it scrolls above the
    // header-offset line, the bar is pinned.
    const obs = new IntersectionObserver(
      ([entry]) => setIsPinned(!entry.isIntersecting),
      { rootMargin: `-${HEADER_OFFSET_PX}px 0px 0px 0px`, threshold: 0 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const hidden = isPinned && scrollHidden;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Effective filters: when locked to a fixedQuery, ignore user input.
  const effectiveQuery = isLocked ? fixedQuery : debouncedQuery;
  const effectiveTopic = isLocked ? undefined : selectedTopic;

  // Reset & fetch first page when filters change
  useEffect(() => {
    const myId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    getArticlesPage({
      q: effectiveQuery || undefined,
      topic: effectiveTopic ?? undefined,
      limit: PAGE_SIZE,
    })
      .then((page) => {
        if (myId !== requestIdRef.current) return; // stale response
        setArticles(page.articles);
        setCursor(page.next_cursor);
        setHasMore(page.next_cursor !== null);
      })
      .catch((err) => {
        if (myId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load articles');
        setArticles([]);
        setCursor(null);
        setHasMore(false);
      })
      .finally(() => {
        if (myId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [effectiveQuery, effectiveTopic]);

  // Load next page (cursor pagination)
  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore || !cursor) return;
    const myId = requestIdRef.current; // tied to current filter set
    setLoadingMore(true);

    getArticlesPage({
      q: effectiveQuery || undefined,
      topic: effectiveTopic ?? undefined,
      cursor,
      limit: PAGE_SIZE,
    })
      .then((page) => {
        if (myId !== requestIdRef.current) return;
        setArticles((prev) => [...prev, ...page.articles]);
        setCursor(page.next_cursor);
        setHasMore(page.next_cursor !== null);
      })
      .catch(() => {
        // Silent — user can scroll again to retry.
      })
      .finally(() => {
        if (myId !== requestIdRef.current) return;
        setLoadingMore(false);
      });
  }, [loadingMore, loading, hasMore, cursor, effectiveQuery, effectiveTopic]);

  // IntersectionObserver sentinel for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '400px 0px' } // pre-load before sentinel hits viewport
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [loadMore]);

  const resolvedTitle = title === undefined ? 'Latest News' : title;

  return (
    <div className="space-y-4">
      {!isLocked && (
        <>
          {/* Pin sentinel: sits in normal flow just above the sticky bar.
              When it scrolls above the global header line, the bar is "pinned"
              and we allow scroll-direction hide to take effect. */}
          <div ref={pinSentinelRef} aria-hidden className="h-px" />

          {/* Sticky header: search + topic tags. Hides on scroll-down once pinned. */}
          <motion.div
            animate={{ y: hidden ? -120 : 0, opacity: hidden ? 0 : 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="sticky z-30 -mx-4 px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800/60 space-y-3"
            style={{ top: HEADER_OFFSET_PX }}
          >
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search news..."
                className="w-full pl-12 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-sm font-light focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Topic pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTopic === null
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
                }`}
              >
                All
              </button>
              {ARTICLE_TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTopic(selectedTopic === t.id ? null : t.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedTopic === t.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Section title */}
      {resolvedTitle && (
        <h2 className="text-lg font-semibold text-white">{resolvedTitle}</h2>
      )}

      {/* Initial loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="border-red-500/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && articles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Newspaper className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {emptyMessage
                ?? (debouncedQuery || selectedTopic
                  ? 'No articles match your search.'
                  : 'No articles yet. Run the news scraper to populate the feed.')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Article list */}
      {!loading && !error && articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((item, index) => {
            const imageSrc = getImageSrc(item.summary);
            const urlOrId = item.url !== '#' ? item.url : String(item.id ?? index);
            const seen = isSeen(urlOrId);
            return (
              <motion.div
                key={`${item.source}-${item.id ?? item.url}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <a
                  href={item.url}
                  target={item.url === '#' ? undefined : '_blank'}
                  rel={item.url === '#' ? undefined : 'noopener noreferrer'}
                  className="block"
                  onClick={(e) => {
                    if (item.url === '#') e.preventDefault();
                    else requireAuth(() => markSeen(urlOrId));
                  }}
                >
                  <Card
                    className={`hover:bg-slate-800/80 transition-colors cursor-pointer group overflow-hidden border-slate-800 ${
                      seen ? 'opacity-85' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="h-32 sm:h-auto sm:w-48 flex-shrink-0 relative overflow-hidden">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-cyan-600 to-blue-600" />
                        )}
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        <div className="absolute bottom-2 left-2">
                          <Badge
                            variant="secondary"
                            className="bg-black/30 backdrop-blur-sm text-white border-none text-[10px]"
                          >
                            {item.source || 'News'}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                              {item.title}
                            </h3>
                            <div
                              className="flex items-center gap-1 shrink-0"
                              onClick={(e) => e.preventDefault()}
                            >
                              <ArticleActions urlOrId={urlOrId} />
                              <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100" />
                            </div>
                          </div>

                          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                            {getPlainText(item.summary)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            <span>{item.source}</span>
                            {seen && <span className="text-slate-500">· Read</span>}
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatDate(item.published_at)}
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </a>
              </motion.div>
            );
          })}

          {/* Sentinel + load-more spinner */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loadingMore && <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />}
            </div>
          )}

          {!hasMore && articles.length > 0 && (
            <p className="text-center text-xs text-slate-500 py-6">
              You&apos;re all caught up.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
