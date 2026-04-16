/**
 * UserStore: global user state via React Context + reducer.
 * Signed-in users: persists via ApiUserRepository (backend DB).
 * Guests: state is null; mutations are no-ops.
 */
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { UserState, UserProfile, FollowEntity, FollowEntityType } from '../types/domain';
import type { IUserRepository } from '../repositories/UserRepository';
import { ApiUserRepository } from '../repositories/ApiUserRepository';

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

const UserStateContext = createContext<UserState | null>(null);
const UserDispatchContext = createContext<React.Dispatch<UserAction> | null>(null);
const UserReadyContext = createContext<boolean>(false);
const UserRepoContext = createContext<React.MutableRefObject<IUserRepository | null> | null>(null);

export function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [state, dispatch] = useReducer(userReducer, null);
  const [ready, setReady] = useState(false);
  const repoRef = useRef<IUserRepository | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Guest: no profile, no repo
      repoRef.current = null;
      dispatch({ type: 'SET_STATE', payload: null });
      setReady(true);
      return;
    }

    // Signed in: use API repo
    const repo = new ApiUserRepository(getToken);
    repoRef.current = repo;
    setReady(false);
    repo.getMe().then((s) => {
      dispatch({ type: 'SET_STATE', payload: s });
      setReady(true);
    }).catch(() => {
      dispatch({ type: 'SET_STATE', payload: null });
      setReady(true);
    });
  }, [isSignedIn, isLoaded, getToken]);

  return (
    <UserStateContext.Provider value={state}>
      <UserDispatchContext.Provider value={dispatch}>
        <UserReadyContext.Provider value={ready}>
          <UserRepoContext.Provider value={repoRef}>
            {children}
          </UserRepoContext.Provider>
        </UserReadyContext.Provider>
      </UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
}

export function useUserState(): UserState | null {
  return useContext(UserStateContext) ?? null;
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
  const repoRef = useContext(UserRepoContext);

  const repo = repoRef?.current ?? null;

  const completeOnboarding = useCallback(
    async (profile: UserProfile) => {
      if (!repo) return;
      await repo.saveProfile(profile);
      const next = await repo.getMe();
      dispatch?.({ type: 'SET_STATE', payload: next });
    },
    [repo, dispatch]
  );

  const updateProfile = useCallback(
    async (partial: Partial<UserProfile>) => {
      if (!repo || !state) return;
      // ApiUserRepository has updateProfile; cast to access it
      if ('updateProfile' in repo) await (repo as any).updateProfile(partial);
      dispatch?.({ type: 'UPDATE_PROFILE', payload: partial });
    },
    [repo, dispatch, state]
  );

  const follow = useCallback(
    async (type: FollowEntityType, entity: FollowEntity) => {
      if (!repo) return;
      dispatch?.({ type: 'FOLLOW', payload: { type, entity } });
      await repo.follow(type, entity);
    },
    [repo, dispatch]
  );

  const unfollow = useCallback(
    async (type: FollowEntityType, entityId: string) => {
      if (!repo) return;
      dispatch?.({ type: 'UNFOLLOW', payload: { type, entityId } });
      await repo.unfollow(type, entityId);
    },
    [repo, dispatch]
  );

  const saveArticle = useCallback(
    async (urlOrId: string) => {
      if (!repo) return;
      dispatch?.({ type: 'SAVE_ARTICLE', payload: urlOrId });
      await repo.saveArticle(urlOrId);
    },
    [repo, dispatch]
  );

  const unsaveArticle = useCallback(
    async (urlOrId: string) => {
      if (!repo) return;
      dispatch?.({ type: 'UNSAVE_ARTICLE', payload: urlOrId });
      await repo.unsaveArticle(urlOrId);
    },
    [repo, dispatch]
  );

  const markSeen = useCallback(
    async (urlOrId: string) => {
      if (!repo) return;
      dispatch?.({ type: 'MARK_SEEN', payload: urlOrId });
      await repo.markSeen(urlOrId);
    },
    [repo, dispatch]
  );

  const touchVisit = useCallback(async () => {
    if (!repo) return;
    dispatch?.({ type: 'TOUCH_VISIT' });
    await repo.touchVisit();
  }, [repo, dispatch]);

  const completeLearnModule = useCallback(
    async (moduleId: string) => {
      if (!repo) return;
      dispatch?.({ type: 'COMPLETE_LEARN', payload: moduleId });
      await repo.completeLearnModule(moduleId);
    },
    [repo, dispatch]
  );

  const resetProfile = useCallback(async () => {
    if (!repo) return;
    await repo.reset();
    dispatch?.({ type: 'RESET' });
  }, [repo, dispatch]);

  const isFollowing = useCallback(
    (type: FollowEntityType, entityId: string): boolean => {
      if (!state) return false;
      const key = type === 'athlete' ? 'athletes' : type === 'event' ? 'events' : type === 'topic' ? 'topics' : 'storylines';
      return state.follows[key].some((e) => e.id === entityId);
    },
    [state]
  );

  const isSaved = useCallback(
    (urlOrId: string): boolean => !!state?.contentState.savedArticles.includes(urlOrId),
    [state]
  );

  const isSeen = useCallback(
    (urlOrId: string): boolean => !!state?.contentState.seenArticles.some((s) => s.id === urlOrId),
    [state]
  );

  return {
    state,
    ready,
    completeOnboarding,
    updateProfile,
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
