/**
 * LocalStorylineRepository: reads from local data. Replace with ApiStorylineRepository
 * when backend provides GET /storylines and GET /storylines/:id.
 */
import type { Storyline } from '../types/domain';
import type { IStorylineRepository } from './StorylineRepository';
import { storylinesData } from '../data/storylines';

export class LocalStorylineRepository implements IStorylineRepository {
  async list(): Promise<Storyline[]> {
    return [...storylinesData];
  }

  async getById(id: string): Promise<Storyline | null> {
    return storylinesData.find((s) => s.id === id) ?? null;
  }
}
