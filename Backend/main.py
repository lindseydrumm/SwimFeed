# Fast API app
#   handles adding and retrieving data from db

from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import create_engine, text

# main app
app = FastAPI()

# engine
DATABASE_URL = "postgresql+psycopg2://dev:dev@db:5432/swimlive"
engine = create_engine(DATABASE_URL)


# article structure
class ArticleIn(BaseModel):
    title: str
    url: str
    published_at: datetime | None
    summary: str | None
    source: str


@app.post("/ingest/article")
def ingest_article(article: ArticleIn):
    query = text("""
                 INSERT INTO articles (title, url, published_at, summary, source)
                 VALUES (:title, :url, :published_at, :summary, :source)
                 ON CONFLICT (url) DO NOTHING;
                 """)

    with engine.begin() as conn:
        conn.execute(query, article.model_dump())

    return {"status": "ok"}


@app.get("/articles")
def list_articles():
    query = text("SELECT * FROM articles ORDER BY published_at DESC")

    with engine.begin() as conn:
        rows = conn.execute(query).mappings().all()

    return rows
