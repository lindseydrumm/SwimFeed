from datetime import datetime

from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text

# import environmental variables
from config import settings

# main app
app = FastAPI(title=settings.app_name, debug=settings.debug)

# Allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def slugify(name: str) -> str:
    return (
        name.lower()
        .replace("'", "")
        .replace(".", "")
        .replace("é", "e")
        .replace("è", "e")
        .replace("ê", "e")
        .replace("à", "a")
        .replace(" ", "-")
    )


# engine
# Render provides postgres:// but SQLAlchemy requires postgresql://
db_url = settings.database_url.replace("postgres://", "postgresql+psycopg2://", 1)
engine = create_engine(db_url)


@app.on_event("startup")
def create_tables():
    """Ensure all tables exist on startup (needed for Render / non-Docker deploys)."""
    with engine.begin() as conn:
        conn.execute(
            text("""
            CREATE TABLE IF NOT EXISTS athletes (
                id            SERIAL PRIMARY KEY,
                slug          TEXT UNIQUE NOT NULL,
                external_id   INTEGER UNIQUE NOT NULL,
                name          TEXT NOT NULL,
                country       TEXT,
                flag          TEXT,
                strokes       TEXT,
                bio           TEXT,
                medals        INTEGER,
                world_records INTEGER,
                world_rank    INTEGER,
                img           TEXT
            );
            CREATE TABLE IF NOT EXISTS articles (
                id            SERIAL PRIMARY KEY,
                title         TEXT NOT NULL,
                url           TEXT UNIQUE NOT NULL,
                published_at  TIMESTAMP,
                summary       TEXT,
                source        TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS events (
                id              SERIAL PRIMARY KEY,
                external_id     INTEGER UNIQUE NOT NULL,
                name            TEXT NOT NULL,
                date_from       TIMESTAMP,
                date_to         TIMESTAMP,
                city            TEXT,
                country         TEXT,
                country_code    TEXT,
                competition_type TEXT,
                disciplines     TEXT
            );
        """)
        )


###################################
# Articles
###################################


class ArticleIn(BaseModel):
    title: str
    url: str
    published_at: datetime | None
    summary: str | None
    source: str


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


###################################
# Athletes
###################################


class AthleteIn(BaseModel):
    external_id: int
    name: str
    country: str | None = None
    flag: str | None = None
    strokes: str | None = None
    bio: str | None = None
    medals: int | None = None
    world_records: int | None = None
    world_rank: int | None = None
    img: str | None = None


@app.post("/ingest/athlete")
def ingest_athlete(athlete: AthleteIn):
    # Generate slug from name for URL-friendly lookup
    slug = slugify(athlete.name)
    payload = athlete.model_dump()
    payload["slug"] = slug
    query = text(
        """
        INSERT INTO athletes (external_id, slug, name, country, flag, strokes, bio, medals, world_records, world_rank, img)
        VALUES (:external_id, :slug, :name, :country, :flag, :strokes, :bio, :medals, :world_records, :world_rank, :img)
        ON CONFLICT (external_id) DO UPDATE SET
            slug = EXCLUDED.slug,
            name = EXCLUDED.name,
            country = EXCLUDED.country,
            flag = EXCLUDED.flag,
            strokes = EXCLUDED.strokes,
            bio = EXCLUDED.bio,
            medals = EXCLUDED.medals,
            world_records = EXCLUDED.world_records,
            world_rank = EXCLUDED.world_rank,
            img = EXCLUDED.img;
        """
    )

    with engine.begin() as conn:
        conn.execute(query, payload)


class AthleteBatchIn(BaseModel):
    slugs: list[str]


@app.get("/athletes")
def list_athletes(
    q: Optional[str] = Query(None, description="Case-insensitive name search"),
    country: Optional[str] = Query(None, description="Exact country code filter"),
    limit: int = Query(40, ge=1, le=100, description="Page size"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    conditions: list[str] = []
    params: dict = {"limit": limit, "offset": offset}

    if q:
        conditions.append("name ILIKE :q")
        params["q"] = f"%{q}%"
    if country:
        conditions.append("country = :country")
        params["country"] = country

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    count_query = text(f"SELECT COUNT(*) FROM athletes {where}")
    data_query = text(
        f"SELECT * FROM athletes {where} ORDER BY name ASC LIMIT :limit OFFSET :offset"
    )

    with engine.begin() as conn:
        total = conn.execute(count_query, params).scalar()
        rows = conn.execute(data_query, params).mappings().all()

    return {"athletes": rows, "total": total}


@app.get("/athletes/countries")
def list_athlete_countries():
    """Return the top 20 most common country codes."""
    query = text(
        """
        SELECT country, COUNT(*) AS cnt
        FROM athletes
        WHERE country IS NOT NULL AND country != ''
        GROUP BY country
        ORDER BY cnt DESC
        LIMIT 20
        """
    )
    with engine.begin() as conn:
        rows = conn.execute(query).mappings().all()
    return [row["country"] for row in rows]


@app.post("/athletes/batch")
def batch_athletes(body: AthleteBatchIn):
    """Return athletes matching a list of slugs."""
    if not body.slugs:
        return []
    # Build parameterised IN clause
    placeholders = ", ".join([f":s{i}" for i in range(len(body.slugs))])
    params = {f"s{i}": s for i, s in enumerate(body.slugs)}
    query = text(
        f"SELECT * FROM athletes WHERE slug IN ({placeholders}) ORDER BY name ASC"
    )
    with engine.begin() as conn:
        rows = conn.execute(query, params).mappings().all()
    return rows


@app.get("/athletes/{slug}")
def get_athlete(slug: str):
    query = text("SELECT * FROM athletes WHERE slug = :slug")

    with engine.begin() as conn:
        row = conn.execute(query, {"slug": slug}).mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    return row


###################################
# Events
###################################


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
