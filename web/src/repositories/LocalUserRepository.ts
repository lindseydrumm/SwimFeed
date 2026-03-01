/**
 * LocalUserRepository: implements IUserRepository using localStorage.
 * Persists full UserState; swap to ApiUserRepository when backend exists.
 */
import type {
  UserState,
  UserProfile,
  FollowEntity,
  FollowEntityType,
  ContentState,
  ActivityState,
  DigestPreference,
} from '../types/domain';
import type { IUserRepository } from './UserRepository';

const STORAGE_KEY = 'swimlive_user_state';

const defaultProfile: UserProfile = {
  displayName: 'Jordan',
  goals: [],
  interests: {},
  digestPreference: 'weekly' as DigestPreference,
  onboardingComplete: false,
};

const defaultContentState: ContentState = {
  savedArticles: [],
  seenArticles: [],
};

const defaultActivity: ActivityState = {
  lastVisitAt: null,
  streakCount: 0,
  learnCompletions: [],
};

function defaultState(): UserState {
  return {
    profile: { ...defaultProfile },
    follows: { athletes: [], events: [], topics: [], storylines: [] },
    contentState: { ...defaultContentState },
    activity: { ...defaultActivity },
  };
}

function loadState(): UserState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserState;
    if (!parsed.profile?.onboardingComplete) return parsed;
    return {
      profile: { ...defaultProfile, ...parsed.profile },
      follows: {
        athletes: parsed.follows?.athletes ?? [],
        events: parsed.follows?.events ?? [],
        topics: parsed.follows?.topics ?? [],
        storylines: parsed.follows?.storylines ?? [],
      },
      contentState: {
        savedArticles: parsed.contentState?.savedArticles ?? [],
        seenArticles: parsed.contentState?.seenArticles ?? [],
      },
      activity: {
        lastVisitAt: parsed.activity?.lastVisitAt ?? null,
        streakCount: parsed.activity?.streakCount ?? 0,
        learnCompletions: parsed.activity?.learnCompletions ?? [],
      },
    };
  } catch {
    return null;
  }
}

function saveState(state: UserState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export class LocalUserRepository implements IUserRepository {
  private state: UserState = defaultState();

  constructor() {
    const loaded = loadState();
    if (loaded) this.state = loaded;
  }

  private persist(): void {
    saveState(this.state);
  }

  async getMe(): Promise<UserState | null> {
    const loaded = loadState();
    if (loaded) {
      this.state = loaded;
      return loaded;
    }
    return null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    this.state.profile = { ...this.state.profile, ...profile };
    this.persist();
  }

  async follow(type: FollowEntityType, entity: FollowEntity): Promise<void> {
    const list = this.state.follows[type === 'athlete' ? 'athletes' : type === 'event' ? 'events' : type === 'topic' ? 'topics' : 'storylines'];
    if (list.some((e) => e.id === entity.id)) return;
    list.push({ ...entity, type });
    this.persist();
  }

  async unfollow(type: FollowEntityType, entityId: string): Promise<void> {
    const key = type === 'athlete' ? 'athletes' : type === 'event' ? 'events' : type === 'topic' ? 'topics' : 'storylines';
    this.state.follows[key] = this.state.follows[key].filter((e) => e.id !== entityId);
    this.persist();
  }

  async getFollows() {
    return { ...this.state.follows };
  }

  async getContentState(): Promise<ContentState> {
    return { ...this.state.contentState };
  }

  async saveArticle(urlOrId: string): Promise<void> {
    if (!this.state.contentState.savedArticles.includes(urlOrId)) {
      this.state.contentState.savedArticles.push(urlOrId);
      this.persist();
    }
  }

  async unsaveArticle(urlOrId: string): Promise<void> {
    this.state.contentState.savedArticles = this.state.contentState.savedArticles.filter((x) => x !== urlOrId);
    this.persist();
  }

  async markSeen(urlOrId: string): Promise<void> {
    const exists = this.state.contentState.seenArticles.some((s) => s.id === urlOrId);
    if (!exists) {
      this.state.contentState.seenArticles.push({ id: urlOrId, seenAt: new Date().toISOString() });
      this.persist();
    }
  }

  async getSavedArticles(): Promise<string[]> {
    return [...this.state.contentState.savedArticles];
  }

  async getSeenArticles(): Promise<{ id: string; seenAt: string }[]> {
    return [...this.state.contentState.seenArticles];
  }

  async touchVisit(): Promise<void> {
    const now = new Date().toISOString();
    const prev = this.state.activity.lastVisitAt;
    const prevDate = prev ? new Date(prev).toDateString() : null;
    const today = new Date().toDateString();
    if (prevDate !== today) {
      if (prevDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (prevDate === yesterday.toDateString()) {
          this.state.activity.streakCount += 1;
        } else {
          this.state.activity.streakCount = 1;
        }
      } else {
        this.state.activity.streakCount = 1;
      }
    }
    this.state.activity.lastVisitAt = now;
    this.persist();
  }

  async completeLearnModule(moduleId: string): Promise<void> {
    if (!this.state.activity.learnCompletions.includes(moduleId)) {
      this.state.activity.learnCompletions.push(moduleId);
      this.persist();
    }
  }

  async reset(): Promise<void> {
    this.state = defaultState();
    this.persist();
  }
}
