from datetime import datetime, timezone
from typing import Annotated, Optional

import json
import bleach
import jwt
from jwt import PyJWKClient
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


# ---------------------------------------------------------------------------
# Clerk JWT authentication
# ---------------------------------------------------------------------------

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        if not settings.clerk_jwks_url:
            raise HTTPException(status_code=500, detail="CLERK_JWKS_URL not configured")
        _jwks_client = PyJWKClient(settings.clerk_jwks_url)
    return _jwks_client


def get_clerk_user_id(authorization: str | None = Header(None)) -> str:
    """Extract and verify Clerk JWT; return the Clerk user ID (sub claim)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        data = jwt.decode(token, signing_key.key, algorithms=["RS256"])
        return data["sub"]
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc


def _user_state(row: dict) -> dict:
    """Convert a DB row to the UserState shape the frontend expects."""
    return {
        "profile": {
            "displayName": row["display_name"],
            "goals": row["goals"],
            "interests": row["interests"],
            "digestPreference": row["digest_preference"],
            "onboardingComplete": row["onboarding_complete"],
        },
        "follows": row["follows"],
        "contentState": {
            "savedArticles": row["saved_articles"],
            "seenArticles": row["seen_articles"],
        },
        "activity": {
            "lastVisitAt": row["last_visit_at"].isoformat() if row["last_visit_at"] else None,
            "streakCount": row["streak_count"],
            "learnCompletions": row["learn_completions"],
        },
    }


def _upsert_user(conn, clerk_id: str) -> dict:
    """Insert user if not exists, return the row."""
    conn.execute(
        text("""
            INSERT INTO users (clerk_id) VALUES (:clerk_id)
            ON CONFLICT (clerk_id) DO NOTHING
        """),
        {"clerk_id": clerk_id},
    )
    row = conn.execute(
        text("SELECT * FROM users WHERE clerk_id = :clerk_id"),
        {"clerk_id": clerk_id},
    ).mappings().first()
    return dict(row)


# ---------------------------------------------------------------------------
# /me — user profile endpoints (all require Clerk JWT)
# ---------------------------------------------------------------------------


@app.get("/me")
def get_me(clerk_id: str = Depends(get_clerk_user_id)):
    with engine.begin() as conn:
        row = _upsert_user(conn, clerk_id)
    return _user_state(row)


class OnboardingIn(BaseModel):
    displayName: str
    goals: list = []
    interests: dict = {}
    digestPreference: str = "daily"


@app.post("/me/onboarding")
def complete_onboarding(body: OnboardingIn, clerk_id: str = Depends(get_clerk_user_id)):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users SET
                    display_name = :display_name,
                    goals = CAST(:goals AS JSONB),
                    interests = CAST(:interests AS JSONB),
                    digest_preference = :digest_preference,
                    onboarding_complete = TRUE,
                    updated_at = now()
                WHERE clerk_id = :clerk_id
            """),
            {
                "clerk_id": clerk_id,
                "display_name": body.displayName,
                "goals": json.dumps(body.goals),
                "interests": json.dumps(body.interests),
                "digest_preference": body.digestPreference,
            },
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


class ProfilePatch(BaseModel):
    displayName: Optional[str] = None
    digestPreference: Optional[str] = None
    goals: Optional[list] = None
    interests: Optional[dict] = None


@app.patch("/me")
def update_profile(body: ProfilePatch, clerk_id: str = Depends(get_clerk_user_id)):
    with engine.begin() as conn:
        if body.displayName is not None:
            conn.execute(text("UPDATE users SET display_name = :v, updated_at = now() WHERE clerk_id = :c"),
                         {"v": body.displayName, "c": clerk_id})
        if body.digestPreference is not None:
            conn.execute(text("UPDATE users SET digest_preference = :v, updated_at = now() WHERE clerk_id = :c"),
                         {"v": body.digestPreference, "c": clerk_id})
        if body.goals is not None:
            conn.execute(
                text("UPDATE users SET goals = CAST(:v AS JSONB), updated_at = now() WHERE clerk_id = :c"),
                {"v": json.dumps(body.goals), "c": clerk_id},
            )
        if body.interests is not None:
            conn.execute(
                text("UPDATE users SET interests = CAST(:v AS JSONB), updated_at = now() WHERE clerk_id = :c"),
                {"v": json.dumps(body.interests), "c": clerk_id},
            )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


class FollowIn(BaseModel):
    type: str
    entity: dict  # { id, type, name, meta? }


@app.post("/me/follow")
def follow(body: FollowIn, clerk_id: str = Depends(get_clerk_user_id)):
    key = {"athlete": "athletes", "event": "events", "topic": "topics", "storyline": "storylines"}.get(body.type)
    if not key:
        raise HTTPException(400, "Invalid entity type")
    with engine.begin() as conn:
        conn.execute(
            text(f"""
                UPDATE users SET
                    follows = jsonb_set(
                        follows,
                        '{{"{key}"}}',
                        CASE
                            WHEN follows->'{key}' @> jsonb_build_array(jsonb_build_object('id', :entity_id))
                            THEN follows->'{key}'
                            ELSE follows->'{key}' || CAST(:entity AS JSONB)
                        END
                    ),
                    updated_at = now()
                WHERE clerk_id = :clerk_id
            """),
            {"clerk_id": clerk_id, "entity_id": body.entity["id"], "entity": json.dumps([body.entity])},
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


@app.delete("/me/follow/{entity_type}/{entity_id}")
def unfollow(entity_type: str, entity_id: str, clerk_id: str = Depends(get_clerk_user_id)):
    key = {"athlete": "athletes", "event": "events", "topic": "topics", "storyline": "storylines"}.get(entity_type)
    if not key:
        raise HTTPException(400, "Invalid entity type")
    with engine.begin() as conn:
        conn.execute(
            text(f"""
                UPDATE users SET
                    follows = jsonb_set(
                        follows,
                        '{{"{key}"}}',
                        (SELECT jsonb_agg(elem)
                         FROM jsonb_array_elements(follows->'{key}') elem
                         WHERE elem->>'id' != :entity_id)
                    ),
                    updated_at = now()
                WHERE clerk_id = :clerk_id
            """),
            {"clerk_id": clerk_id, "entity_id": entity_id},
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


class SavedIn(BaseModel):
    urlOrId: str


@app.post("/me/saved")
def save_article(body: SavedIn, clerk_id: str = Depends(get_clerk_user_id)):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users SET
                    saved_articles = CASE
                        WHEN saved_articles @> CAST(:val AS JSONB) THEN saved_articles
                        ELSE saved_articles || CAST(:val AS JSONB)
                    END,
                    updated_at = now()
                WHERE clerk_id = :clerk_id
            """),
            {"clerk_id": clerk_id, "val": json.dumps([body.urlOrId])},
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


@app.delete("/me/saved/{url_or_id:path}")
def unsave_article(url_or_id: str, clerk_id: str = Depends(get_clerk_user_id)):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users SET
                    saved_articles = (
                        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
                        FROM jsonb_array_elements(saved_articles) elem
                        WHERE elem::text != :val
                    ),
                    updated_at = now()
                WHERE clerk_id = :clerk_id
            """),
            {"clerk_id": clerk_id, "val": json.dumps(url_or_id)},
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


class SeenIn(BaseModel):
    urlOrId: str


@app.post("/me/seen")
def mark_seen(body: SeenIn, clerk_id: str = Depends(get_clerk_user_id)):
    seen_entry = {"id": body.urlOrId, "seenAt": datetime.now(timezone.utc).isoformat()}
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users SET
                    seen_articles = CASE
                        WHEN EXISTS (
                            SELECT 1 FROM jsonb_array_elements(seen_articles) e WHERE e->>'id' = :url_or_id
                        )
                        THEN seen_articles
                        ELSE seen_articles || CAST(:entry AS JSONB)
                    END,
                    updated_at = now()
                WHERE clerk_id = :clerk_id
            """),
            {"clerk_id": clerk_id, "url_or_id": body.urlOrId, "entry": json.dumps([seen_entry])},
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


@app.post("/me/visit")
def touch_visit(clerk_id: str = Depends(get_clerk_user_id)):
    with engine.begin() as conn:
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
        now = datetime.now(timezone.utc)
        prev = row["last_visit_at"]
        streak = row["streak_count"]
        if prev is None or prev.date() != now.date():
            if prev is not None:
                from datetime import timedelta
                yesterday = (now - timedelta(days=1)).date()
                streak = streak + 1 if prev.date() == yesterday else 1
            else:
                streak = 1
        conn.execute(
            text("UPDATE users SET last_visit_at = :now, streak_count = :streak, updated_at = now() WHERE clerk_id = :c"),
            {"c": clerk_id, "now": now, "streak": streak},
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


@app.post("/me/learn/{module_id}")
def complete_learn(module_id: str, clerk_id: str = Depends(get_clerk_user_id)):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users SET
                    learn_completions = CASE
                        WHEN learn_completions @> CAST(:val AS JSONB) THEN learn_completions
                        ELSE learn_completions || CAST(:val AS JSONB)
                    END,
                    updated_at = now()
                WHERE clerk_id = :clerk_id
            """),
            {"clerk_id": clerk_id, "val": json.dumps([module_id])},
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


@app.post("/me/reset")
def reset_user(clerk_id: str = Depends(get_clerk_user_id)):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users SET
                    display_name = '',
                    goals = '[]',
                    interests = '{}',
                    digest_preference = 'daily',
                    onboarding_complete = FALSE,
                    follows = '{"athletes":[],"events":[],"topics":[],"storylines":[]}',
                    saved_articles = '[]',
                    seen_articles = '[]',
                    last_visit_at = NULL,
                    streak_count = 0,
                    learn_completions = '[]',
                    updated_at = now()
                WHERE clerk_id = :clerk_id
            """),
            {"clerk_id": clerk_id},
        )
        row = dict(conn.execute(text("SELECT * FROM users WHERE clerk_id = :c"), {"c": clerk_id}).mappings().first())
    return _user_state(row)


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
