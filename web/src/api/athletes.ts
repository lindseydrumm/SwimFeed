import { apiGet, apiPost } from './client';

export type Athlete = {
  id: number;
  external_id: number;
  slug: string;
  name: string;
  country?: string | null;
  flag?: string | null;
  strokes?: string | null;
  bio?: string | null;
  medals?: number | null;
  world_records?: number | null;
  world_rank?: number | null;
  img?: string | null;
};

export interface AthletesResponse {
  athletes: Athlete[];
  total: number;
}

export interface AthleteSearchParams {
  q?: string;
  country?: string;
  limit?: number;
  offset?: number;
}

export function getAthletes(params: AthleteSearchParams = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.country) qs.set('country', params.country);
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.offset != null) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return apiGet<AthletesResponse>(`/athletes${query ? `?${query}` : ''}`);
}

export function getAthlete(slug: string) {
  return apiGet<Athlete>(`/athletes/${slug}`);
}

export function getAthleteCountries() {
  return apiGet<string[]>('/athletes/countries');
}

export function getAthletesBySlug(slugs: string[]) {
  if (slugs.length === 0) return Promise.resolve([]);
  return apiPost<Athlete[]>('/athletes/batch', { slugs });
}

export type AthleteSlugMapping = {
  external_id: number;
  slug: string;
  name: string;
  img: string | null;
};

export function getAthletesByExtIds(externalIds: number[]) {
  if (externalIds.length === 0) return Promise.resolve([]);
  return apiPost<AthleteSlugMapping[]>('/athletes/batch-by-ext-id', { external_ids: externalIds });
}

