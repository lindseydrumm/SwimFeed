//
//  NewsFeed.tsx
//  
//
//  Created by Lindsey Drumm on 2/10/26.
//


import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

// Uses the API wrapper instead of calling fetch directly in the component.
import { getArticles } from '../src/api/articles';
import { ArticleActions } from './ArticleActions';
import { useUser } from '../src/store/UserStore';
import { useGuestGate } from '../src/hooks/useGuestGate';

type Article = {
  id: number;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  source: string;
};

// Kept: Original mock data for local UI testing without the backend.
const fake_news = [
  {
    id: 1,
    title: 'Marchand Eyes Sub-4:00 in 400m IM at Worlds',
    summary:
      'The French superstar is reportedly hitting times in practice that suggest the first ever sub-4 minute swim is possible.',
    timeAgo: '2h ago',
    athlete: 'Léon Marchand',
    type: 'Preview',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 2,
    title: 'McIntosh Sets New Canadian Record in Trials',
    summary:
      'Summer McIntosh continues her dominance with a blistering 3:56.08 in the 400m Freestyle, signaling readiness for Budapest.',
    timeAgo: '5h ago',
    athlete: 'Summer McIntosh',
    type: 'Result',
    color: 'from-red-600 to-rose-700',
  },
  {
    id: 3,
    title: 'Ledecky on Chasing Her 5th Olympic Gold',
    summary:
      'In an exclusive interview, Katie Ledecky discusses longevity, training changes, and her mindset heading into another Olympic cycle.',
    timeAgo: '1d ago',
    athlete: 'Katie Ledecky',
    type: 'Interview',
    color: 'from-cyan-600 to-blue-600',
  },
  {
    id: 4,
    title: 'Dressel Returns to Competition After Break',
    summary:
      'Caeleb Dressel looked sharp in his return to the pool at the Pro Swim Series, posting a competitive 50m Free time.',
    timeAgo: '2d ago',
    athlete: 'Caeleb Dressel',
    type: 'Update',
    color: 'from-emerald-600 to-teal-700',
  },
];

export function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { markSeen, isSeen } = useUser();
  const { requireAuth } = useGuestGate();

  // Kept: HTML summary to plain text.
  const getPlainText = (html?: string | null) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Kept: Extracts first image from HTML summary.
  const getImageSrc = (html?: string | null) => {
    if (!html) return null;
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const img = temp.querySelector('img');
    return img ? img.src : null;
  };

  // Added: Safe date formatting.
  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  // Added: Fetches real data from GET /articles on mount.
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticles();
        setArticles(data);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load articles');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Added: Fallback to fake data if API fails or returns empty.
  const items: Article[] =
    !error && articles.length > 0
      ? articles
      : fake_news.map((n) => ({
          id: n.id,
          title: n.title,
          url: '#',
          published_at: null,
          summary: n.summary,
          source: 'mock',
        }));
    
  // FUNCTION to select relevant articles
  // for now, just first 5
  const custom_items = items.slice(0,5)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Latest News</h2>

      {/* Added: Minimal status UI */}
      {loading && <div className="text-sm text-slate-400">Loading...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="space-y-4">
        {custom_items.map((item, index) => {
          const imageSrc = getImageSrc(item.summary);
          const urlOrId = item.url !== '#' ? item.url : String(item.id ?? index);
          const seen = isSeen(urlOrId);
          return (
            <motion.div
              key={`${item.source}-${item.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
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
                <Card className={`hover:bg-slate-800/80 transition-colors cursor-pointer group overflow-hidden border-slate-800 ${seen ? 'opacity-85' : ''}`}>
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
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
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
      </div>
    </div>
  );
}

