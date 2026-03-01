import type { Storyline } from '../types/domain';

export interface IStorylineRepository {
  list(): Promise<Storyline[]>;
  getById(id: string): Promise<Storyline | null>;
}
