# Fast API app
#   handles adding and retrieving data from db

from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import create_engine, text

# import environmental variables
from config import settings

# main app
app = FastAPI(title=settings.app_name, debug=settings.debug)

# engine
engine = create_engine(settings.database_url)


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
