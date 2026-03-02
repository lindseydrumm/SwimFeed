import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { ChevronRight } from 'lucide-react';

interface LaneCardProps {
  id: string;
  title: string;
  description: string;
  imageId?: string;
}

export function LaneCard({ id, title, description, imageId }: LaneCardProps) {
  return (
    <Link to={`/explore/${id}`}>
      <Card
        animate={false}
        className="h-full hover:border-cyan-500/30 transition-colors cursor-pointer overflow-hidden group"
      >
        <div className="aspect-video bg-slate-800 relative">
          {imageId && (
            <img
              src={`https://images.unsplash.com/photo-${imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
              {title}
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
