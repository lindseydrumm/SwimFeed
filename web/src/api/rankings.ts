import { apiGet } from "./client";

export type Ranking = {
  id: number;
  athlete_ext_id: number;
  athlete_name: string;
  country_code: string | null;
  gender: string;
  distance: number;
  stroke: string;
  pool: string;
  rank: number;
  time: string;
  fina_points: number | null;
  event_name: string | null;
  event_city: string | null;
  result_date: string | null;
  ranking_type: string;
};

export type Record = {
  id: number;
  athlete_ext_id: number;
  athlete_name: string;
  country_code: string | null;
  gender: string;
  distance: number;
  stroke: string;
  pool: string;
  time: string;
  fina_points: number | null;
  event_name: string | null;
  event_city: string | null;
  result_date: string | null;
};

export async function getRankings(params: {
  gender?: string;
  stroke?: string;
  distance?: number;
  pool?: string;
  ranking_type?: string;
}): Promise<Ranking[]> {
  const qs = new URLSearchParams();
  if (params.gender) qs.set("gender", params.gender);
  if (params.stroke) qs.set("stroke", params.stroke);
  if (params.distance) qs.set("distance", String(params.distance));
  if (params.pool) qs.set("pool", params.pool);
  if (params.ranking_type) qs.set("ranking_type", params.ranking_type);
  const q = qs.toString();
  return apiGet<Ranking[]>(`/rankings${q ? `?${q}` : ""}`);
}

export async function getRecords(params?: {
  gender?: string;
  pool?: string;
}): Promise<Record[]> {
  const qs = new URLSearchParams();
  if (params?.gender) qs.set("gender", params.gender);
  if (params?.pool) qs.set("pool", params.pool);
  const q = qs.toString();
  return apiGet<Record[]>(`/records${q ? `?${q}` : ""}`);
}
