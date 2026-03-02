/**
 * /recap — articles read this week, saved count, follows added, learn completed, streak + badges.
 */
import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { StreakBadge } from '../../components/StreakBadge';
import { useUser } from '../store/UserStore';
import { Bookmark, Eye, Users, BookOpen, Flame } from 'lucide-react';

export function RecapPage() {
  const { state } = useUser();
  const profile = state?.profile;
  const content = state?.contentState;
  const activity = state?.activity;
  const follows = state?.follows;

  const savedCount = content?.savedArticles?.length ?? 0;
  const seenCount = content?.seenArticles?.length ?? 0;
  const followCount =
    (follows?.athletes?.length ?? 0) +
    (follows?.events?.length ?? 0) +
    (follows?.topics?.length ?? 0) +
    (follows?.storylines?.length ?? 0);
  const learnCount = activity?.learnCompletions?.length ?? 0;
  const streak = activity?.streakCount ?? 0;

  // "This week" — filter seenArticles by last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const seenThisWeek =
    content?.seenArticles?.filter((s) => new Date(s.seenAt) >= weekAgo).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-white mb-2">Your Recap</h1>
      <p className="text-slate-400 text-sm mb-8">
        A quick look at your activity and progress.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card animate={false}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{seenThisWeek}</p>
              <p className="text-sm text-slate-500">Articles read this week</p>
            </div>
          </CardContent>
        </Card>
        <Card animate={false}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{savedCount}</p>
              <p className="text-sm text-slate-500">Saved articles</p>
            </div>
          </CardContent>
        </Card>
        <Card animate={false}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{followCount}</p>
              <p className="text-sm text-slate-500">Total follows</p>
            </div>
          </CardContent>
        </Card>
        <Card animate={false}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{learnCount}</p>
              <p className="text-sm text-slate-500">Learn modules completed</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card animate={false} className="border-amber-500/20">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8 text-amber-400" />
            <div>
              <p className="font-semibold text-white">Visit streak</p>
              <p className="text-sm text-slate-500">Days you opened SwimStats</p>
            </div>
          </div>
          <StreakBadge count={streak} />
        </CardContent>
      </Card>
    </div>
  );
}
