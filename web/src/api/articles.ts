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

export function getArticles() {
  return apiGet<Article[]>("/articles");
}
