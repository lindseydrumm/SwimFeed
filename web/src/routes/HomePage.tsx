/**
 * My Feed dashboard: personalized header, Since last visit, For You, Because you follow, Watchlist, Continue Reading, Explore Next.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { SectionHeader } from '../../components/SectionHeader';
import { StreakBadge } from '../../components/StreakBadge';
import { useUser } from '../store/UserStore';
import { useGuestGate } from '../hooks/useGuestGate';
import { YourAthletes } from '../../components/YourAthletes';
import { UpcomingRaces } from '../../components/UpcomingRaces';
import { NewsFeed } from '../../components/NewsFeed';
import { RecentResults } from '../../components/RecentResults';
import { FeaturedCarousel } from '../../components/FeaturedCarousel';
import { AthleteInfoBar } from '../../components/AthleteInfoBar';
import { exploreLanes } from '../data/lanes';
import { Sparkles, Settings, Bookmark, Compass } from 'lucide-react';
import type { Article } from '../types/domain';

export function HomePage() {
  const { state, touchVisit, ready } = useUser();
  const { isGuest } = useGuestGate();
  const [newSinceCount, setNewSinceCount] = useState<number | null>(null);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);

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

  useEffect(() => {
    if (lastVisit) setNewSinceCount(3);
    else setNewSinceCount(null);
  }, [lastVisit]);

  const suggestedLanes = exploreLanes.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Featured carousel */}
      <section>
        <FeaturedCarousel onArticleChange={setCurrentArticle} />
      </section>

      {/* Athlete info bar */}
      <AthleteInfoBar article={currentArticle} />

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
                ' — add some in Explore or Settings'}
              .
            </span>
            {streak > 0 && <StreakBadge count={streak} className="ml-1" />}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-cyan-500/50"
          >
            <Settings className="h-4 w-4" />
            Edit interests
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-cyan-500/50"
          >
            <Compass className="h-4 w-4" />
            Add follows
          </Link>
          <Link
            to="/saved"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30"
          >
            <Bookmark className="h-4 w-4" />
            View saved ({savedCount})
          </Link>
        </div>
      </div>

      {/* Since your last visit */}
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

      {/* Your Athletes rail */}
      <section>
        <YourAthletes />
      </section>

      {/* Upcoming Races / Watchlist */}
      <section>
        <UpcomingRaces />
      </section>

      {/* For You + Recent Results grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <SectionHeader title="For You" subtitle="News ranked by your interests and follows" />
          <NewsFeed />
        </section>
        <section className="lg:col-span-1">
          <RecentResults />
        </section>
      </div>

      {/* Explore Next */}
      <section>
        <SectionHeader
          title="Explore Next"
          subtitle="Pick a lane based on your interests"
          action={
            <Link to="/explore" className="text-sm text-cyan-400 hover:text-cyan-300">
              See all
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {suggestedLanes.map((lane) => (
            <Link key={lane.id} to={`/explore/${lane.id}`}>
              <Card
                animate={false}
                className="h-full hover:border-cyan-500/30 transition-colors cursor-pointer overflow-hidden"
              >
                <div className="aspect-video bg-slate-800 relative">
                  <img
                    src={`https://images.unsplash.com/photo-${lane.imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-semibold text-white text-sm">{lane.title}</h3>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}