/**
 * UserStore: global user state via React Context + reducer.
 * Persists via IUserRepository (LocalUserRepository). DB-ready: swap repo to Api.
 */
import React, { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import type { UserState, UserProfile, FollowEntity, FollowEntityType } from '../types/domain';
import type { IUserRepository } from '../repositories/UserRepository';
import { LocalUserRepository } from '../repositories/LocalUserRepository';

type UserAction =
  | { type: 'SET_STATE'; payload: UserState | null }
  | { type: 'COMPLETE_ONBOARDING'; payload: UserProfile }
  | { type: 'FOLLOW'; payload: { type: FollowEntityType; entity: FollowEntity } }
  | { type: 'UNFOLLOW'; payload: { type: FollowEntityType; entityId: string } }
  | { type: 'SAVE_ARTICLE'; payload: string }
  | { type: 'UNSAVE_ARTICLE'; payload: string }
  | { type: 'MARK_SEEN'; payload: string }
  | { type: 'TOUCH_VISIT' }
  | { type: 'COMPLETE_LEARN'; payload: string }
  | { type: 'RESET' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> };

function userReducer(state: UserState | null, action: UserAction): UserState | null {
  if (action.type === 'SET_STATE') return action.payload;
  if (action.type === 'RESET') return null;
  if (!state) return state;

  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        profile: { ...state.profile, ...action.payload, onboardingComplete: true },
      };
    case 'FOLLOW': {
      const key = action.payload.type === 'athlete' ? 'athletes' : action.payload.type === 'event' ? 'events' : action.payload.type === 'topic' ? 'topics' : 'storylines';
      const list = state.follows[key];
      if (list.some((e) => e.id === action.payload.entity.id)) return state;
      return {
        ...state,
        follows: {
          ...state.follows,
          [key]: [...list, { ...action.payload.entity, type: action.payload.type }],
        },
      };
    }
    case 'UNFOLLOW': {
      const key = action.payload.type === 'athlete' ? 'athletes' : action.payload.type === 'event' ? 'events' : action.payload.type === 'topic' ? 'topics' : 'storylines';
      return {
        ...state,
        follows: {
          ...state.follows,
          [key]: state.follows[key].filter((e) => e.id !== action.payload.entityId),
        },
      };
    }
    case 'SAVE_ARTICLE':
      return state.contentState.savedArticles.includes(action.payload)
        ? state
        : {
            ...state,
            contentState: {
              ...state.contentState,
              savedArticles: [...state.contentState.savedArticles, action.payload],
            },
          };
    case 'UNSAVE_ARTICLE':
      return {
        ...state,
        contentState: {
          ...state.contentState,
          savedArticles: state.contentState.savedArticles.filter((x) => x !== action.payload),
        },
      };
    case 'MARK_SEEN':
      return state.contentState.seenArticles.some((s) => s.id === action.payload)
        ? state
        : {
            ...state,
            contentState: {
              ...state.contentState,
              seenArticles: [...state.contentState.seenArticles, { id: action.payload, seenAt: new Date().toISOString() }],
            },
          };
    case 'TOUCH_VISIT': {
      const now = new Date().toISOString();
      const prev = state.activity.lastVisitAt;
      const prevDate = prev ? new Date(prev).toDateString() : null;
      const today = new Date().toDateString();
      let streak = state.activity.streakCount;
      if (prevDate !== today) {
        if (prevDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          streak = prevDate === yesterday.toDateString() ? streak + 1 : 1;
        } else {
          streak = 1;
        }
      }
      return {
        ...state,
        activity: { ...state.activity, lastVisitAt: now, streakCount: streak },
      };
    }
    case 'COMPLETE_LEARN':
      return state.activity.learnCompletions.includes(action.payload)
        ? state
        : {
            ...state,
            activity: {
              ...state.activity,
              learnCompletions: [...state.activity.learnCompletions, action.payload],
            },
          };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    default:
      return state;
  }
}

const repo: IUserRepository = new LocalUserRepository();

const UserStateContext = createContext<UserState | null>(null);
const UserDispatchContext = createContext<React.Dispatch<UserAction> | null>(null);
const UserReadyContext = createContext<boolean>(false);

export function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    repo.getMe().then((s) => {
      dispatch({ type: 'SET_STATE', payload: s });
      setReady(true);
    });
  }, []);

  return (
    <UserStateContext.Provider value={state}>
      <UserDispatchContext.Provider value={dispatch}>
        <UserReadyContext.Provider value={ready}>
          {children}
        </UserReadyContext.Provider>
      </UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
}

export function useUserState(): UserState | null {
  const ctx = useContext(UserStateContext);
  return ctx ?? null;
}

export function useUserReady(): boolean {
  return useContext(UserReadyContext);
}

export function useUser(): {
  state: UserState | null;
  ready: boolean;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  follow: (type: FollowEntityType, entity: FollowEntity) => Promise<void>;
  unfollow: (type: FollowEntityType, entityId: string) => Promise<void>;
  saveArticle: (urlOrId: string) => Promise<void>;
  unsaveArticle: (urlOrId: string) => Promise<void>;
  markSeen: (urlOrId: string) => Promise<void>;
  touchVisit: () => Promise<void>;
  completeLearnModule: (moduleId: string) => Promise<void>;
  resetProfile: () => Promise<void>;
  isFollowing: (type: FollowEntityType, entityId: string) => boolean;
  isSaved: (urlOrId: string) => boolean;
  isSeen: (urlOrId: string) => boolean;
} {
  const state = useUserState();
  const dispatch = useContext(UserDispatchContext);
  const ready = useUserReady();

  const completeOnboarding = useCallback(
    async (profile: UserProfile) => {
      await repo.saveProfile(profile);
      const next = await repo.getMe();
      if (next) dispatch?.({ type: 'SET_STATE', payload: next });
      else dispatch?.({ type: 'COMPLETE_ONBOARDING', payload: profile });
    },
    [dispatch]
  );

  const updateProfile = useCallback(
    async (partial: Partial<UserProfile>) => {
      if (!state) return;
      const next = { ...state.profile, ...partial };
      await repo.saveProfile(next);
      dispatch?.({ type: 'UPDATE_PROFILE', payload: partial });
    },
    [dispatch, state]
  );

  const follow = useCallback(
    async (type: FollowEntityType, entity: FollowEntity) => {
      await repo.follow(type, entity);
      const next = await repo.getMe();
      if (next) dispatch?.({ type: 'SET_STATE', payload: next });
      else dispatch?.({ type: 'FOLLOW', payload: { type, entity } });
    },
    [dispatch]
  );

  const unfollow = useCallback(
    async (type: FollowEntityType, entityId: string) => {
      await repo.unfollow(type, entityId);
      const next = await repo.getMe();
      if (next) dispatch?.({ type: 'SET_STATE', payload: next });
      else dispatch?.({ type: 'UNFOLLOW', payload: { type, entityId } });
    },
    [dispatch]
  );

  const saveArticle = useCallback(
    async (urlOrId: string) => {
      await repo.saveArticle(urlOrId);
      dispatch?.({ type: 'SAVE_ARTICLE', payload: urlOrId });
    },
    [dispatch]
  );

  const unsaveArticle = useCallback(
    async (urlOrId: string) => {
      await repo.unsaveArticle(urlOrId);
      dispatch?.({ type: 'UNSAVE_ARTICLE', payload: urlOrId });
    },
    [dispatch]
  );

  const markSeen = useCallback(
    async (urlOrId: string) => {
      await repo.markSeen(urlOrId);
      dispatch?.({ type: 'MARK_SEEN', payload: urlOrId });
    },
    [dispatch]
  );

  const touchVisit = useCallback(async () => {
    await repo.touchVisit();
    dispatch?.({ type: 'TOUCH_VISIT' });
  }, [dispatch]);

  const completeLearnModule = useCallback(
    async (moduleId: string) => {
      await repo.completeLearnModule(moduleId);
      dispatch?.({ type: 'COMPLETE_LEARN', payload: moduleId });
    },
    [dispatch]
  );

  const resetProfile = useCallback(async () => {
    await repo.reset();
    dispatch?.({ type: 'RESET' });
  }, [dispatch]);

  const isFollowing = useCallback(
    (type: FollowEntityType, entityId: string): boolean => {
      if (!state) return false;
      const key = type === 'athlete' ? 'athletes' : type === 'event' ? 'events' : type === 'topic' ? 'topics' : 'storylines';
      return state.follows[key].some((e) => e.id === entityId);
    },
    [state]
  );

  const isSaved = useCallback(
    (urlOrId: string): boolean => {
      return !!state?.contentState.savedArticles.includes(urlOrId);
    },
    [state]
  );

  const isSeen = useCallback(
    (urlOrId: string): boolean => {
      return !!state?.contentState.seenArticles.some((s) => s.id === urlOrId);
    },
    [state]
  );

  return {
    state,
    ready,
    completeOnboarding,
    follow,
    unfollow,
    saveArticle,
    unsaveArticle,
    markSeen,
    touchVisit,
    completeLearnModule,
    resetProfile,
    isFollowing,
    isSaved,
    isSeen,
  };
}
