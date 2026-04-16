import type {
  UserState,
  UserProfile,
  FollowEntity,
  FollowEntityType,
  ContentState,
} from '../types/domain';
import type { IUserRepository } from './UserRepository';
import { apiGet, apiPost, apiPatch, apiDelete } from '../api/client';

export class ApiUserRepository implements IUserRepository {
  constructor(private getToken: () => Promise<string | null>) {}

  private async tok(): Promise<string | undefined> {
    return (await this.getToken()) ?? undefined;
  }

  async getMe(): Promise<UserState | null> {
    return apiGet<UserState>('/me', await this.tok());
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await apiPost('/me/onboarding', {
      displayName: profile.displayName,
      goals: profile.goals,
      interests: profile.interests,
      digestPreference: profile.digestPreference,
    }, await this.tok());
  }

  async follow(type: FollowEntityType, entity: FollowEntity): Promise<void> {
    await apiPost('/me/follow', { type, entity }, await this.tok());
  }

  async unfollow(type: FollowEntityType, entityId: string): Promise<void> {
    await apiDelete(`/me/follow/${type}/${encodeURIComponent(entityId)}`, await this.tok());
  }

  async getFollows() {
    const state = await this.getMe();
    return state?.follows ?? { athletes: [], events: [], topics: [], storylines: [] };
  }

  async getContentState(): Promise<ContentState> {
    const state = await this.getMe();
    return state?.contentState ?? { savedArticles: [], seenArticles: [] };
  }

  async saveArticle(urlOrId: string): Promise<void> {
    await apiPost('/me/saved', { urlOrId }, await this.tok());
  }

  async unsaveArticle(urlOrId: string): Promise<void> {
    await apiDelete(`/me/saved/${encodeURIComponent(urlOrId)}`, await this.tok());
  }

  async markSeen(urlOrId: string): Promise<void> {
    await apiPost('/me/seen', { urlOrId }, await this.tok());
  }

  async getSavedArticles(): Promise<string[]> {
    return (await this.getContentState()).savedArticles;
  }

  async getSeenArticles(): Promise<{ id: string; seenAt: string }[]> {
    return (await this.getContentState()).seenArticles;
  }

  async touchVisit(): Promise<void> {
    await apiPost('/me/visit', {}, await this.tok());
  }

  async completeLearnModule(moduleId: string): Promise<void> {
    await apiPost(`/me/learn/${encodeURIComponent(moduleId)}`, {}, await this.tok());
  }

  async reset(): Promise<void> {
    await apiPost('/me/reset', {}, await this.tok());
  }

  async updateProfile(partial: Partial<UserProfile>): Promise<void> {
    await apiPatch('/me', {
      ...(partial.displayName !== undefined && { displayName: partial.displayName }),
      ...(partial.digestPreference !== undefined && { digestPreference: partial.digestPreference }),
    }, await this.tok());
  }
}
