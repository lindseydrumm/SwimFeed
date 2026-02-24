/**
 * Domain types for Swim Live. DB-ready: shaped for future API/DB.
 */

// --- Onboarding & profile ---
export type OnboardingGoal = 'news' | 'events' | 'athletes' | 'training';

export type DigestPreference = 'daily' | 'weekly' | 'big_news_only';

export interface UserProfile {
  displayName: string;
  goals: OnboardingGoal[];
  interests: {
    strokes?: string[];
    distances?: string[];
    countries?: string[];
    topics?: string[];
  };
  digestPreference: DigestPreference;
  onboardingComplete: boolean;
}

// --- Follow entities (unified shape for athletes, events, topics, storylines) ---
export type FollowEntityType = 'athlete' | 'event' | 'topic' | 'storyline';

export interface FollowEntity {
  id: string;
  type: FollowEntityType;
  name: string;
  meta?: Record<string, unknown>;
}

export interface FollowsState {
  athletes: FollowEntity[];
  events: FollowEntity[];
  topics: FollowEntity[];
  storylines: FollowEntity[];
}

// --- Content state ---
export interface ContentState {
  savedArticles: string[]; // urls or ids
  seenArticles: { id: string; seenAt: string }[]; // id/url + ISO timestamp
}

// --- Activity (retention, streak, recap) ---
export interface ActivityState {
  lastVisitAt: string | null; // ISO
  streakCount: number;
  learnCompletions: string[]; // module ids
}

// --- Full user state (store shape) ---
export interface UserState {
  profile: UserProfile;
  follows: FollowsState;
  contentState: ContentState;
  activity: ActivityState;
}

// --- Storyline ---
export interface StorylineTimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  type?: string;
}

export interface Storyline {
  id: string;
  title: string;
  summary: string;
  keyAthletes: string[];
  keyEvents: string[];
  timeline: StorylineTimelineItem[];
  meta?: Record<string, unknown>;
}

// --- Learn module ---
export interface LearnModule {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'checklist' | 'guess_split' | 'info';
  steps?: { question?: string; options?: string[]; correctIndex?: number; content?: string }[];
}

// --- Explore lane ---
export interface ExploreLane {
  id: string;
  title: string;
  description: string;
  recommendedFollows: FollowEntity[];
  articleIds?: string[];
  imageId?: string;
}

// --- Article (from API) ---
export interface Article {
  id?: number;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  source: string;
}
