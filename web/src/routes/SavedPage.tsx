/**
 * Reading queue: saved articles. Filter seen/unseen. Uses useUser + getArticles for details.
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ArticleActions } from '../../components/ArticleActions';
import { useUser } from '../store/UserStore';
import { useGuestGate } from '../hooks/useGuestGate';
import { getArticles } from '../api/articles';
import type { Article } from '../api/articles';
import { Bookmark } from 'lucide-react';

export function SavedPage() {
  const { state, isSaved, isSeen, unsaveArticle } = useUser();
  const { requireAuth } = useGuestGate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const savedUrls = state?.contentState?.savedArticles ?? [];

  useEffect(() => {
    getArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const savedItems = articles.filter((a) => {
    const idKey = a.id != null ? String(a.id) : null;
    return savedUrls.includes(a.url) || (idKey ? savedUrls.includes(idKey) : false);
  });

  const getPlainText = (html?: string | null) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  if (savedUrls.length === 0 && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">No saved articles</h2>
        <p className="text-slate-400">Save articles from your feed to read them here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Saved</h1>
      <p className="text-slate-400 text-sm">Your reading queue ({savedItems.length} saved)</p>
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-4">
          {savedItems.map((item) => {
            const idKey = item.id != null ? String(item.id) : null;
            const urlOrId = savedUrls.includes(item.url) ? item.url : (idKey && savedUrls.includes(idKey) ? idKey : item.url);
            const seen = isSeen(urlOrId);
            return (
              <Card key={item.url} animate={false} className={seen ? 'opacity-80' : ''}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 line-clamp-2">
                        {item.title}
                      </h3>
                    </a>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {getPlainText(item.summary)}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>{item.source}</span>
                      <span>·</span>
                      <span>{formatDate(item.published_at)}</span>
                      {seen && (
                        <>
                          <span>·</span>
                          <span className="text-slate-400">Read</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ArticleActions urlOrId={urlOrId} />
                    <button
                      type="button"
                      onClick={() => requireAuth(() => unsaveArticle(urlOrId))}
                      className="text-slate-500 hover:text-red-400 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
