/**
 * Featured carousel: displays the latest articles from the API as
 * full-bleed banner slides with auto-play, navigation dots, and
 * smooth transitions. Falls back to static swimming imagery when
 * the API is unavailable or returns no data.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { getArticles } from '../src/api/articles';
import type { Article } from '../src/types/domain';

// --- Static fallback slides (used when API fails or returns empty) ---
const fallbackSlides = [
  {
    title: 'Olympic Dreams',
    subtitle: 'The road to Paris 2024',
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    url: null as string | null,
  },
  {
    title: 'World Records',
    subtitle: 'Breaking barriers in the pool',
    imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    url: null as string | null,
  },
  {
    title: 'Championship Moments',
    subtitle: 'Elite competition at its finest',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    url: null as string | null,
  },
  {
    title: 'Training Excellence',
    subtitle: 'Where champions are made',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    url: null as string | null,
  },
  {
    title: 'Swimming Culture',
    subtitle: 'Stories from the water',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    url: null as string | null,
  },
];

// Swimming-related Unsplash images cycled per-slide as a background when
// the article's RSS summary does not contain an embedded <img>.
const POOL_IMAGES = [
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
];

interface Slide {
  title: string;
  subtitle: string;
  imageUrl: string;
  url: string | null;
}

// --- Helpers ---

/** Extract the first <img src> from an HTML string (RSS summary). */
function extractImageFromHtml(html: string | null): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/** Strip HTML tags to produce plain subtitle text. */
function stripHtml(html: string | null): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/** Turn an Article into a carousel Slide. */
function articleToSlide(article: Article, index: number): Slide {
  const image = extractImageFromHtml(article.summary);
  return {
    title: article.title,
    subtitle: article.source
      ? `${article.source}${article.published_at ? ' · ' + new Date(article.published_at).toLocaleDateString() : ''}`
      : stripHtml(article.summary).slice(0, 120) || '',
    imageUrl: image ?? POOL_IMAGES[index % POOL_IMAGES.length],
    url: article.url,
  };
}

const MAX_SLIDES = 5;

export function FeaturedCarousel() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // TODO: Select articles based on personalisation
  useEffect(() => {
    let cancelled = false;
    getArticles()
      .then((data) => {
        if (cancelled) return;
        if (data.length > 0) {
          setSlides(data.slice(0, MAX_SLIDES).map(articleToSlide));
        }
        // else keep fallback slides
      })
      .catch(() => {
        // keep fallback slides on error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Auto-play
  useEffect(() => {
    if (isPaused || loading) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, loading, slides.length]);

  // Reset index if slides change
  useEffect(() => {
    setCurrentIndex(0);
  }, [slides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const current = slides[currentIndex];

  const inner = (
    <div
      className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-2xl">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <img
                src={current.imageUrl}
                alt={current.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
                    {current.title}
                  </h2>
                  <p className="text-lg md:text-xl text-slate-300 font-light flex items-center gap-2">
                    {current.subtitle}
                    {current.url && (
                      <ExternalLink className="w-4 h-4 text-slate-400 inline-block shrink-0" />
                    )}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:bg-slate-900/80 transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 backdrop-blur-sm text-white hover:bg-slate-900/80 transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToSlide(index); }}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-cyan-400'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  // If the current slide has a URL, wrap the whole thing in a link
  if (!loading && current.url) {
    return (
      <a href={current.url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return inner;
}
