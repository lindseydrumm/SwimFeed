/**
 * My Feed dashboard: featured carousel, personalized header, Since last visit,
 * Your Athletes, Upcoming Races, infinite-scroll news feed, Recent Results,
 * and AthleteInfoBar driven by the loaded news articles.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { StreakBadge } from '../../components/StreakBadge';
import { useUser } from '../store/UserStore';
import { useGuestGate } from '../hooks/useGuestGate';
import { UpcomingRaces } from '../../components/UpcomingRaces';
import { NewsFeedInfinite } from '../../components/NewsFeedInfinite';
import { RecentResults } from '../../components/RecentResults';
import { FeaturedCarousel } from '../../components/FeaturedCarousel';
import { AthleteInfoBar } from '../../components/AthleteInfoBar';
import { Sparkles, Settings, Bookmark } from 'lucide-react';
import type { Article } from '../api/articles';

export function HomePage() {
  const { state, touchVisit, ready } = useUser();
  const { isGuest } = useGuestGate();

  const [newSinceCount, setNewSinceCount] = useState<number | null>(null);
  const [latestNewsArticles, setLatestNewsArticles] = useState<Article[]>([]);

  // Touch visit when user is authenticated
  useEffect(() => {
    if (ready && !isGuest) touchVisit();
  }, [ready, isGuest, touchVisit]);

  const name = state?.profile?.displayName ?? 'there';
  const lastVisit = state?.activity?.lastVisitAt;
  const follows = state?.follows;
  const athleteCount = follows?.athletes?.length ?? 0;
  const eventCount = follows?.events?.length ?? 0;
  const topicCount = follows?.topics?.length ?? 0;
  const storylineCount = follows?.storylines?.length ?? 0;
  const savedCount = state?.contentState?.savedArticles?.length ?? 0;
  const streak = state?.activity?.streakCount ?? 0;

  // Calculate new articles since last visit
  useEffect(() => {
    if (lastVisit) setNewSinceCount(3);
    else setNewSinceCount(null);
  }, [lastVisit]);

  return (
    <div className="space-y-8">
      {/* Featured carousel */}
      <section>
        <FeaturedCarousel
          onArticleChange={() => {}}
          autoPlayInterval={5000}
        />
      </section>

      {/* Personalized header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Welcome back, {name}
          </h1>
          <p className="text-slate-400 text-sm md:text-base flex items-center gap-2 flex-wrap">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              You&apos;re following{' '}
              <span className="text-cyan-400 font-semibold">{athleteCount} athletes</span>
              {eventCount > 0 && (
                <>
                  , <span className="text-cyan-400 font-semibold">{eventCount} events</span>
                </>
              )}
              {(topicCount + storylineCount) > 0 && (
                <>
                  , and{' '}
                  <span className="text-cyan-400 font-semibold">
                    {topicCount + storylineCount} topics/storylines
                  </span>
                </>
              )}
              {athleteCount === 0 &&
                eventCount === 0 &&
                topicCount === 0 &&
                storylineCount === 0 &&
                ' — add some in Settings'}
              .
            </span>
            {streak > 0 && <StreakBadge count={streak} className="ml-1" />}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-cyan-500/50 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Edit interests
          </Link>
          <Link
            to="/saved"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
          >
            <Bookmark className="h-4 w-4" />
            View saved ({savedCount})
          </Link>
        </div>
      </div>

      {/* Since last visit */}
      {lastVisit && (
        <Card animate={false} className="border-cyan-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">
              <span className="text-white font-medium">
                New since {new Date(lastVisit).toLocaleDateString()}
              </span>
              {newSinceCount != null && (
                <>
                  {' '}
                  — <span className="text-cyan-400">{newSinceCount} articles</span> in your
                  feed
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Athletes-in-the-news bar (replaces the followed-athletes rail).
          Driven by articles loaded from NewsFeedInfinite below. */}
      <section>
        <AthleteInfoBar articles={latestNewsArticles} />
      </section>

      {/* Upcoming Races / Watchlist */}
      <section>
        <UpcomingRaces />
      </section>

      {/* News feed (full-width) + Recent Results sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <NewsFeedInfinite onArticlesChange={setLatestNewsArticles} />
        </section>

        <section className="lg:col-span-1">
          <RecentResults />
        </section>
      </div>
    </div>
  );
}
