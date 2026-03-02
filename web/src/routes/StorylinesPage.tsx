/**
 * /storylines — list of storylines. Data from LocalStorylineRepository.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { LocalStorylineRepository } from '../repositories/LocalStorylineRepository';
import type { Storyline } from '../types/domain';
import { ChevronRight } from 'lucide-react';

const repo = new LocalStorylineRepository();

export function StorylinesPage() {
  const [storylines, setStorylines] = useState<Storyline[]>([]);

  useEffect(() => {
    repo.list().then(setStorylines);
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-white mb-2">Storylines</h1>
      <p className="text-slate-400 text-sm mb-8">
        Follow narrative arcs: rivalries, records, and road to Paris.
      </p>
      <div className="space-y-4">
        {storylines.map((s) => (
          <Link key={s.id} to={`/storylines/${s.id}`}>
            <Card animate={false} className="hover:border-cyan-500/30 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-cyan-400">{s.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{s.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {s.keyAthletes.slice(0, 3).map((a) => (
                      <span key={a} className="text-xs text-slate-500">{a}</span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
