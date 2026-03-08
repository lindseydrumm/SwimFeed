# Fast API app
#   handles adding and retrieving data from db

from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy import create_engine, text
from fastapi.middleware.cors import CORSMiddleware

from config import settings

# main app
app = FastAPI()

# Allow cross-origin requests from the frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# event structure
class EventIn(BaseModel):
    external_id: int
    name: str
    date_from: datetime | None
    date_to: datetime | None
    city: str | None
    country: str | None
    country_code: str | None
    competition_type: str | None
    disciplines: str | None


@app.post("/ingest/event")
def ingest_event(event: EventIn):
    query = text("""
                 INSERT INTO events (external_id, name, date_from, date_to,
                                     city, country, country_code,
                                     competition_type, disciplines)
                 VALUES (:external_id, :name, :date_from, :date_to,
                         :city, :country, :country_code,
                         :competition_type, :disciplines)
                 ON CONFLICT (external_id) DO NOTHING;
                 """)

    with engine.begin() as conn:
        conn.execute(query, event.model_dump())

    return {"status": "ok"}


@app.get("/events")
def list_events():
    query = text("SELECT * FROM events ORDER BY date_from ASC")

    with engine.begin() as conn:
        rows = conn.execute(query).mappings().all()

    return rows
