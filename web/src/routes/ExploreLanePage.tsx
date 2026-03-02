/**
 * /explore/:laneId — lane description, recommended follows, relevant content.
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { SectionHeader } from '../../components/SectionHeader';
import { FollowButton } from '../../components/FollowButton';
import { exploreLanes } from '../data/lanes';
import { getArticles } from '../api/articles';
import { useEffect, useState } from 'react';
import type { Article } from '../api/articles';
import { ArrowLeft } from 'lucide-react';

export function ExploreLanePage() {
  const { laneId } = useParams<{ laneId: string }>();
  const lane = exploreLanes.find((l) => l.id === laneId);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    getArticles().then(setArticles).catch(() => setArticles([]));
  }, []);

  if (!lane) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <p className="text-slate-400">Lane not found.</p>
        <Link to="/explore" className="text-cyan-400 hover:underline mt-2 inline-block">Back to Explore</Link>
      </div>
    );
  }

  const relevantArticles = articles.slice(0, 5);

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link
        to="/explore"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </Link>
      <div className="mb-8">
        {lane.imageId && (
          <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-slate-800">
            <img
              src={`https://images.unsplash.com/photo-${lane.imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold text-white mb-2">{lane.title}</h1>
        <p className="text-slate-400">{lane.description}</p>
      </div>

      {lane.recommendedFollows.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Recommended to follow" />
          <div className="flex flex-wrap gap-2">
            {lane.recommendedFollows.map((entity) => (
              <FollowButton
                key={entity.id}
                entityType={entity.type as 'athlete' | 'event' | 'topic' | 'storyline'}
                entityId={entity.id}
                name={entity.name}
                meta={entity.meta}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Related articles" />
        <div className="space-y-3">
          {relevantArticles.length === 0 ? (
            <p className="text-slate-500 text-sm">No articles loaded. Check your feed on the home page.</p>
          ) : (
            relevantArticles.map((a) => (
              <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                <Card animate={false} className="hover:border-cyan-500/30 transition-colors">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-white hover:text-cyan-400">{a.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{a.source}</p>
                  </CardContent>
                </Card>
              </a>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
