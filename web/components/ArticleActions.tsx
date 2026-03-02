/**
 * Save + Seen controls for article cards. Uses useUser.
 */
import React from 'react';
import { Bookmark, Eye } from 'lucide-react';
import { useUser } from '../src/store/UserStore';

interface ArticleActionsProps {
  urlOrId: string;
  onSave?: () => void;
  onUnsave?: () => void;
  onMarkSeen?: () => void;
  className?: string;
}

export function ArticleActions({ urlOrId, className = '' }: ArticleActionsProps) {
  const { isSaved, isSeen, saveArticle, unsaveArticle, markSeen } = useUser();
  const saved = isSaved(urlOrId);
  const seen = isSeen(urlOrId);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (saved) unsaveArticle(urlOrId);
    else saveArticle(urlOrId);
  };

  const handleSeen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markSeen(urlOrId);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleSave}
        className={`p-1.5 rounded-lg transition-colors ${saved ? 'text-cyan-400' : 'text-slate-500 hover:text-cyan-400'}`}
        title={saved ? 'Unsave' : 'Save'}
      >
        <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
      </button>
      <button
        type="button"
        onClick={handleSeen}
        className={`p-1.5 rounded-lg transition-colors ${seen ? 'text-slate-400' : 'text-slate-500 hover:text-slate-400'}`}
        title={seen ? 'Seen' : 'Mark as read'}
      >
        <Eye className={`w-4 h-4 ${seen ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}
