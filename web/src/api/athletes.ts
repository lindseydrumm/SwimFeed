import { apiGet } from "./client";

export type Athlete = {
  id: number;
  slug: string;
  name: string;
  country?: string | null;
  flag?: string | null;
  strokes?: string | null;
  bio?: string | null;
  medals?: number | null;
  world_records?: number | null;
  world_rank?: number | null;
};

export function getAthletes() {
  return apiGet<Athlete[]>("/athletes");
}

export function getAthlete(slug: string) {
  return apiGet<Athlete>(`/athletes/${slug}`);
}

