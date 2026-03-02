/**
 * Reusable FollowButton: entityType + entityId + label. Uses useUser for state.
 */
import React from 'react';
import { Bell } from 'lucide-react';
import type { FollowEntityType, FollowEntity } from '../src/types/domain';
import { useUser } from '../src/store/UserStore';

interface FollowButtonProps {
  entityType: FollowEntityType;
  entityId: string;
  name: string;
  meta?: Record<string, unknown>;
  label?: string;
  followingLabel?: string;
  className?: string;
}

export function FollowButton({
  entityType,
  entityId,
  name,
  meta,
  label = 'Follow',
  followingLabel = 'Following',
  className = '',
}: FollowButtonProps) {
  const { isFollowing, follow, unfollow } = useUser();
  const following = isFollowing(entityType, entityId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const entity: FollowEntity = { id: entityId, type: entityType, name, meta };
    if (following) unfollow(entityType, entityId);
    else follow(entityType, entity);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${following
          ? 'bg-cyan-500 text-white'
          : 'border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-cyan-500/50'
        } ${className}
      `}
    >
      <Bell className={`w-4 h-4 ${following ? 'fill-white' : ''}`} />
      {following ? followingLabel : label}
    </button>
  );
}
