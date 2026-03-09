from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text

# import environmental variables
from config import settings

# main app
app = FastAPI(title=settings.app_name, debug=settings.debug)

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


@app.on_event("startup")
def init_db() -> None:
    """Ensure required tables exist."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS athletes (
                    id SERIAL PRIMARY KEY,
                    slug TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    country TEXT,
                    flag TEXT,
                    strokes TEXT,
                    bio TEXT,
                    medals INTEGER,
                    world_records INTEGER,
                    world_rank INTEGER
                );
                """
            )
        )


# article structure
class ArticleIn(BaseModel):
    title: str
    url: str
    published_at: datetime | None
    summary: str | None
    source: str


class AthleteIn(BaseModel):
    slug: str
    name: str
    country: str | None = None
    flag: str | None = None
    strokes: str | None = None
    bio: str | None = None
    medals: int | None = None
    world_records: int | None = None
    world_rank: int | None = None


@app.post("/ingest/article")
def ingest_article(article: ArticleIn):
    query = text(
        """
        INSERT INTO articles (title, url, published_at, summary, source)
        VALUES (:title, :url, :published_at, :summary, :source)
        ON CONFLICT (url) DO NOTHING;
        """
    )

    with engine.begin() as conn:
        conn.execute(query, article.model_dump())

    return {"status": "ok"}


@app.get("/articles")
def list_articles():
    query = text("SELECT * FROM articles ORDER BY published_at DESC")

    with engine.begin() as conn:
        rows = conn.execute(query).mappings().all()

    return rows


@app.post("/ingest/athlete")
def ingest_athlete(athlete: AthleteIn):
    query = text(
        """
        INSERT INTO athletes (slug, name, country, flag, strokes, bio, medals, world_records, world_rank)
        VALUES (:slug, :name, :country, :flag, :strokes, :bio, :medals, :world_records, :world_rank)
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            country = EXCLUDED.country,
            flag = EXCLUDED.flag,
            strokes = EXCLUDED.strokes,
            bio = EXCLUDED.bio,
            medals = EXCLUDED.medals,
            world_records = EXCLUDED.world_records,
            world_rank = EXCLUDED.world_rank;
        """
    )

    with engine.begin() as conn:
        conn.execute(query, athlete.model_dump())
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


@app.get("/athletes")
def list_athletes():
    query = text("SELECT * FROM athletes ORDER BY name ASC")
@app.get("/events")
def list_events():
    query = text("SELECT * FROM events ORDER BY date_from ASC")

    with engine.begin() as conn:
        rows = conn.execute(query).mappings().all()

    return rows


@app.get("/athletes/{slug}")
def get_athlete(slug: str):
    query = text("SELECT * FROM athletes WHERE slug = :slug")

    with engine.begin() as conn:
        row = conn.execute(query, {"slug": slug}).mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    return row
