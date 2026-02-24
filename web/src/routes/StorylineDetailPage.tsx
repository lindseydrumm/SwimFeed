/**
 * /storylines/:id — detail with summary, athletes/events, timeline, follow button.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { FollowButton } from '../../components/FollowButton';
import { LocalStorylineRepository } from '../repositories/LocalStorylineRepository';
import type { Storyline } from '../types/domain';
import { ArrowLeft, Clock } from 'lucide-react';

const repo = new LocalStorylineRepository();

export function StorylineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [storyline, setStoryline] = useState<Storyline | null>(null);

  useEffect(() => {
    if (id) repo.getById(id).then(setStoryline);
  }, [id]);

  if (!id || !storyline) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <p className="text-slate-400">Storyline not found.</p>
        <Link to="/storylines" className="text-cyan-400 hover:underline mt-2 inline-block">Back to Storylines</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link
        to="/storylines"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Storylines
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-3">{storyline.title}</h1>
        <p className="text-slate-400 leading-relaxed">{storyline.summary}</p>
        <div className="mt-4">
          <FollowButton
            entityType="storyline"
            entityId={storyline.id}
            name={storyline.title}
            meta={{ keyAthletes: storyline.keyAthletes, keyEvents: storyline.keyEvents }}
          />
        </div>
      </div>
      <Card animate={false} className="mb-8">
        <CardContent className="p-5">
          <h3 className="font-semibold text-white mb-2">Key athletes</h3>
          <p className="text-slate-400 text-sm">{storyline.keyAthletes.join(', ')}</p>
          <h3 className="font-semibold text-white mt-4 mb-2">Key events</h3>
          <p className="text-slate-400 text-sm">{storyline.keyEvents.join(', ')}</p>
        </CardContent>
      </Card>
      <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
      <div className="space-y-3">
        {storyline.timeline.map((item) => (
          <Card key={item.id} animate={false}>
            <CardContent className="p-4 flex items-start gap-3">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">{item.title}</h4>
                {item.description && <p className="text-sm text-slate-500 mt-1">{item.description}</p>}
                {item.date && <p className="text-xs text-slate-500 mt-1">{item.date}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
