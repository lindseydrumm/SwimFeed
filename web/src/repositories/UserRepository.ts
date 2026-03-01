/**
 * UserRepository: DB-ready interface. Implement with LocalUserRepository (localStorage)
 * now and ApiUserRepository (HTTP) later.
 */
import type {
  UserState,
  UserProfile,
  FollowEntity,
  FollowEntityType,
  ContentState,
  ActivityState,
} from '../types/domain';

export interface IUserRepository {
  getMe(): Promise<UserState | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  follow(type: FollowEntityType, entity: FollowEntity): Promise<void>;
  unfollow(type: FollowEntityType, entityId: string): Promise<void>;
  getFollows(): Promise<{
    athletes: FollowEntity[];
    events: FollowEntity[];
    topics: FollowEntity[];
    storylines: FollowEntity[];
  }>;
  getContentState(): Promise<ContentState>;
  saveArticle(urlOrId: string): Promise<void>;
  unsaveArticle(urlOrId: string): Promise<void>;
  markSeen(urlOrId: string): Promise<void>;
  getSavedArticles(): Promise<string[]>;
  getSeenArticles(): Promise<{ id: string; seenAt: string }[]>;
  touchVisit(): Promise<void>;
  completeLearnModule(moduleId: string): Promise<void>;
  reset(): Promise<void>;
}
