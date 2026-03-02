import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  count: number;
  className?: string;
}

export function StreakBadge({ count, className = '' }: StreakBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 ${className}`}
    >
      <Flame className="w-3.5 h-3.5" />
      {count} day streak
    </span>
  );
}
