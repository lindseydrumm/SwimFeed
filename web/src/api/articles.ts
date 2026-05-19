// web/src/api/articles.ts
import { apiGet } from "./client";

export type Article = {
  id?: number;
  title: string;
  url: string;
  published_at: string | null;
  summary: string | null;
  source: string;
};

export type ArticlesPage = {
  articles: Article[];
  next_cursor: string | null;
};

export type GetArticlesParams = {
  q?: string;
  topic?: string;
  cursor?: string;
  limit?: number;
};

// Topic tags shown in the feed header. Keep ids in sync with
// ARTICLE_TOPIC_KEYWORDS in Backend/main.py.
export const ARTICLE_TOPICS: { id: string; label: string }[] = [
  { id: "olympics", label: "Olympics" },
  { id: "ncaa", label: "NCAA" },
  { id: "world-champs", label: "World Champs" },
  { id: "records", label: "Records" },
  { id: "us-nationals", label: "US Nationals" },
  { id: "open-water", label: "Open Water" },
];

function buildQuery(params: GetArticlesParams): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.topic) sp.set("topic", params.topic);
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Cursor-paginated article fetch. Preferred for any feed/list view.
 */
export function getArticlesPage(params: GetArticlesParams = {}): Promise<ArticlesPage> {
  return apiGet<ArticlesPage>(`/articles${buildQuery(params)}`);
}

/**
 * Convenience helper: returns the first page as a plain array.
 * Use only when you don't need pagination (e.g. small fixed lists).
 */
export async function getArticles(limit = 50): Promise<Article[]> {
  const page = await getArticlesPage({ limit });
  return page.articles;
}

// --- Featured athletes (driven by article_athletes join) ---

export type FeaturedAthlete = {
  athlete_id: number;
  slug: string;
  name: string;
  country: string | null;
  flag: string | null;
  img: string | null;
  article_id: number;
  title: string;
  url: string;
  summary: string | null;
  published_at: string | null;
  source: string;
  mentions: number;
};

export function getFeaturedAthletes(
  limit = 4,
  days = 14,
): Promise<FeaturedAthlete[]> {
  return apiGet<FeaturedAthlete[]>(
    `/articles/featured-athletes?limit=${limit}&days=${days}`,
  );
}
