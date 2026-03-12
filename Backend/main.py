from datetime import datetime
from typing import Annotated, Optional

import bleach
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import create_engine, text

# import environmental variables
from config import settings

# main app
app = FastAPI(title=settings.app_name, debug=settings.debug)

# Allow cross-origin requests from configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API-key authentication for ingestion endpoints
# ---------------------------------------------------------------------------


def verify_api_key(x_api_key: str | None = Header(None)) -> None:
    """Require a valid X-API-Key header when INGEST_API_KEY is configured.

    If the setting is empty (local dev default), authentication is skipped.
    """
    if not settings.ingest_api_key:
        return  # auth disabled – local dev
    if x_api_key != settings.ingest_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


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
engine = create_engine(settings.database_url)


# deprecated
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
                    external_id INTEGER UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    country TEXT,
                    flag TEXT,
                    strokes TEXT,
                    bio TEXT,
                    medals INTEGER,
                    world_records INTEGER,
                    world_rank INTEGER,
                    img TEXT
                );
                """
            )
        )


###################################
# Articles
###################################


class ArticleIn(BaseModel):
    title: Annotated[str, Field(max_length=500)]
    url: Annotated[str, Field(max_length=2000)]
    published_at: datetime | None
    summary: str | None
    source: Annotated[str, Field(max_length=100)]

    @field_validator("summary", mode="before")
    @classmethod
    def sanitize_summary(cls, v: str | None) -> str | None:
        if v is None:
            return v
        # Allow only <img> tags with src and alt attributes
        return bleach.clean(
            v, tags=["img"], attributes={"img": ["src", "alt"]}, strip=True
        )


@app.post("/ingest/article", dependencies=[Depends(verify_api_key)])
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
    name: Annotated[str, Field(max_length=200)]
    country: Annotated[str | None, Field(max_length=10)] = None
    flag: Annotated[str | None, Field(max_length=10)] = None
    strokes: Annotated[str | None, Field(max_length=500)] = None
    bio: Annotated[str | None, Field(max_length=5000)] = None
    medals: int | None = None
    world_records: int | None = None
    world_rank: int | None = None
    img: Annotated[str | None, Field(max_length=2000)] = None


@app.post("/ingest/athlete", dependencies=[Depends(verify_api_key)])
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
    name: Annotated[str, Field(max_length=300)]
    date_from: datetime | None
    date_to: datetime | None
    city: Annotated[str | None, Field(max_length=100)] = None
    country: Annotated[str | None, Field(max_length=100)] = None
    country_code: Annotated[str | None, Field(max_length=10)] = None
    competition_type: Annotated[str | None, Field(max_length=100)] = None
    disciplines: Annotated[str | None, Field(max_length=500)] = None


@app.post("/ingest/event", dependencies=[Depends(verify_api_key)])
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
