/**
 * ApiUserRepository: stub for future backend. Replace LocalUserRepository
 * when these endpoints exist. Do NOT implement backend here.
 *
 * TODO endpoints:
 *   GET  /me              -> UserState
 *   POST /me/onboarding   -> save profile + onboardingComplete
 *   PATCH /me             -> update profile (displayName, digestPreference)
 *   POST /me/follow       -> body: { type, entity }
 *   DELETE /me/follow/:type/:id
 *   GET  /me/content      -> ContentState
 *   POST /me/saved        -> body: { urlOrId }
 *   DELETE /me/saved/:id
 *   POST /me/seen         -> body: { urlOrId }
 *   POST /me/visit        -> touch lastVisitAt, update streak
 *   POST /me/learn/:moduleId
 *   POST /me/reset        -> reset profile (dev)
 */
import type {
  UserState,
  UserProfile,
  FollowEntity,
  FollowEntityType,
  ContentState,
} from '../types/domain';
import type { IUserRepository } from './UserRepository';

export class ApiUserRepository implements IUserRepository {
  async getMe(): Promise<UserState | null> {
    // TODO: GET /me
    return null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    // TODO: POST /me/onboarding or PATCH /me
  }

  async follow(type: FollowEntityType, entity: FollowEntity): Promise<void> {
    // TODO: POST /me/follow { type, entity }
  }

  async unfollow(type: FollowEntityType, entityId: string): Promise<void> {
    // TODO: DELETE /me/follow/:type/:entityId
  }

  async getFollows() {
    // TODO: part of GET /me or GET /me/follows
    return { athletes: [], events: [], topics: [], storylines: [] };
  }

  async getContentState(): Promise<ContentState> {
    // TODO: GET /me/content
    return { savedArticles: [], seenArticles: [] };
  }

  async saveArticle(urlOrId: string): Promise<void> {
    // TODO: POST /me/saved { urlOrId }
  }

  async unsaveArticle(urlOrId: string): Promise<void> {
    // TODO: DELETE /me/saved/:id
  }

  async markSeen(urlOrId: string): Promise<void> {
    // TODO: POST /me/seen { urlOrId }
  }

  async getSavedArticles(): Promise<string[]> {
    const state = await this.getContentState();
    return state.savedArticles;
  }

  async getSeenArticles(): Promise<{ id: string; seenAt: string }[]> {
    const state = await this.getContentState();
    return state.seenArticles;
  }

  async touchVisit(): Promise<void> {
    // TODO: POST /me/visit
  }

  async completeLearnModule(moduleId: string): Promise<void> {
    // TODO: POST /me/learn/:moduleId
  }

  async reset(): Promise<void> {
    // TODO: POST /me/reset
  }
}
