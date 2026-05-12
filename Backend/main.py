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
from sqlalchemy.exc import IntegrityError

# import environmental variables
from config import settings

# main app
app = FastAPI(title=settings.app_name, debug=settings.debug)

# Allow cross-origin requests from configured origins.
# When DEBUG is on, also allow any localhost / 127.0.0.1 port so Vite can use 5174, 5175, etc.
_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
_cors_kwargs: dict = {
    "allow_origins": _cors_origins,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.debug:
    _cors_kwargs["allow_origin_regex"] = r"^http://(localhost|127\.0\.0\.1):\d+$"
app.add_middleware(CORSMiddleware, **_cors_kwargs)


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
                    img TEXT,
                    gender TEXT,
                    date_of_birth DATE,
                    gold_medals INTEGER,
                    silver_medals INTEGER,
                    bronze_medals INTEGER,
                    discipline TEXT,
                    height TEXT,
                    coach TEXT,
                    club TEXT,
                    detail_scraped_at TIMESTAMPTZ
                );
                CREATE TABLE IF NOT EXISTS athlete_personal_bests (
                    id SERIAL PRIMARY KEY,
                    athlete_ext_id INTEGER NOT NULL,
                    event TEXT NOT NULL,
                    time TEXT NOT NULL,
                    medal TEXT,
                    pool_length TEXT,
                    age INTEGER,
                    competition TEXT,
                    comp_country TEXT,
                    result_date TEXT,
                    UNIQUE (athlete_ext_id, event, pool_length)
                );
                CREATE TABLE IF NOT EXISTS rankings (
                    id              SERIAL PRIMARY KEY,
                    athlete_ext_id  INTEGER NOT NULL,
                    athlete_name    TEXT NOT NULL,
                    country_code    TEXT,
                    gender          TEXT NOT NULL,
                    distance        INTEGER NOT NULL,
                    stroke          TEXT NOT NULL,
                    pool            TEXT NOT NULL,
                    rank            INTEGER NOT NULL,
                    time            TEXT NOT NULL,
                    fina_points     REAL,
                    event_name      TEXT,
                    event_city      TEXT,
                    result_date     TIMESTAMPTZ,
                    ranking_type    TEXT NOT NULL DEFAULT 'alltime',
                    UNIQUE (athlete_ext_id, gender, distance, stroke, pool, ranking_type)
                );
                CREATE TABLE IF NOT EXISTS records (
                    id              SERIAL PRIMARY KEY,
                    athlete_ext_id  INTEGER NOT NULL,
                    athlete_name    TEXT NOT NULL,
                    country_code    TEXT,
                    gender          TEXT NOT NULL,
                    distance        INTEGER NOT NULL,
                    stroke          TEXT NOT NULL,
                    pool            TEXT NOT NULL,
                    time            TEXT NOT NULL,
                    fina_points     REAL,
                    event_name      TEXT,
                    event_city      TEXT,
                    result_date     TIMESTAMPTZ,
                    UNIQUE (gender, distance, stroke, pool)
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


# Topic -> keyword bundle. Matches against title + summary (ILIKE).
# Keep keywords lowercase; ILIKE handles case folding via wildcards.
ARTICLE_TOPIC_KEYWORDS: dict[str, list[str]] = {
    "olympics": ["olympic", "olympics", "paris 2024", "los angeles 2028", "la28"],
    "ncaa": ["ncaa", "college", "sec ", "big ten", "ivy", "pac-12", "acc "],
    "world-champs": ["world championship", "world champs", "fina world", "world aquatics championship"],
    "records": ["world record", "american record", "ncaa record", "broke the record", "broke a record"],
    "us-nationals": ["u.s. nationals", "us nationals", "olympic trials", "usa swimming nationals", "national championships"],
    "open-water": ["open water", "marathon swim", " 10k ", "ows"],
}


@app.get("/articles")
def list_articles(
    q: Optional[str] = Query(None, description="Case-insensitive search on title + summary"),
    topic: Optional[str] = Query(None, description="Topic tag id (see ARTICLE_TOPIC_KEYWORDS)"),
    cursor: Optional[str] = Query(None, description="ISO timestamp; returns rows older than this"),
    limit: int = Query(20, ge=1, le=50, description="Page size"),
):
    """
    Cursor-paginated article feed. Stable across new ingests:
    rows older than `cursor` (published_at) are returned in DESC order.
    Returns next_cursor=null when fewer than `limit` rows remain.
    """
    conditions: list[str] = []
    params: dict = {"limit": limit}

    if q:
        conditions.append("(title ILIKE :q OR summary ILIKE :q)")
        params["q"] = f"%{q}%"

    if topic:
        keywords = ARTICLE_TOPIC_KEYWORDS.get(topic)
        if keywords:
            topic_clauses = []
            for i, kw in enumerate(keywords):
                key = f"topic_kw_{i}"
                topic_clauses.append(f"(title ILIKE :{key} OR summary ILIKE :{key})")
                params[key] = f"%{kw}%"
            conditions.append("(" + " OR ".join(topic_clauses) + ")")
        # Unknown topic id => no extra filter (return everything matching q).

    if cursor:
        conditions.append("published_at < :cursor")
        params["cursor"] = cursor

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    data_query = text(
        f"SELECT * FROM articles {where} ORDER BY published_at DESC NULLS LAST LIMIT :limit"
    )

    with engine.begin() as conn:
        rows = conn.execute(data_query, params).mappings().all()

    rows_list = [dict(r) for r in rows]
    next_cursor = None
    if len(rows_list) == limit:
        last_pub = rows_list[-1].get("published_at")
        if last_pub is not None:
            next_cursor = last_pub.isoformat() if hasattr(last_pub, "isoformat") else str(last_pub)

    return {"articles": rows_list, "next_cursor": next_cursor}


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
    gender: Annotated[str | None, Field(max_length=2)] = None
    date_of_birth: str | None = None


@app.post("/ingest/athlete", dependencies=[Depends(verify_api_key)])
def ingest_athlete(athlete: AthleteIn):
    # Generate slug from name for URL-friendly lookup
    slug = slugify(athlete.name)
    payload = athlete.model_dump()
    payload["slug"] = slug
    query = text(
        """
        INSERT INTO athletes (external_id, slug, name, country, flag, strokes, bio, medals, world_records, world_rank, img, gender, date_of_birth)
        VALUES (:external_id, :slug, :name, :country, :flag, :strokes, :bio, :medals, :world_records, :world_rank, :img, :gender, :date_of_birth)
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
            img = EXCLUDED.img,
            gender = COALESCE(EXCLUDED.gender, athletes.gender),
            date_of_birth = COALESCE(EXCLUDED.date_of_birth, athletes.date_of_birth);
        """
    )

    try:
        with engine.begin() as conn:
            conn.execute(query, payload)
    except IntegrityError:
        # Slug collision: a different athlete with the same name already exists.
        # Retry with the external_id appended to make the slug unique.
        payload["slug"] = f"{slug}-{athlete.external_id}"
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


class AthleteExtIdBatchIn(BaseModel):
    external_ids: list[int]


@app.post("/athletes/batch-by-ext-id")
def batch_athletes_by_ext_id(body: AthleteExtIdBatchIn):
    """Return slug mappings for a list of external_ids."""
    if not body.external_ids:
        return []
    placeholders = ", ".join([f":e{i}" for i in range(len(body.external_ids))])
    params = {f"e{i}": eid for i, eid in enumerate(body.external_ids)}
    query = text(
        f"SELECT external_id, slug, name, img FROM athletes WHERE external_id IN ({placeholders})"
    )
    with engine.begin() as conn:
        rows = conn.execute(query, params).mappings().all()
    return [dict(r) for r in rows]


@app.get("/athletes/{slug}")
def get_athlete(slug: str):
    query = text("SELECT * FROM athletes WHERE slug = :slug")

    with engine.begin() as conn:
        row = conn.execute(query, {"slug": slug}).mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    return row


@app.get("/athletes/{slug}/personal-bests")
def get_athlete_personal_bests(slug: str):
    """Return personal best results for an athlete by slug."""
    with engine.begin() as conn:
        athlete = conn.execute(
            text("SELECT external_id FROM athletes WHERE slug = :slug"),
            {"slug": slug},
        ).mappings().first()
        if not athlete:
            raise HTTPException(status_code=404, detail="Athlete not found")

        rows = conn.execute(
            text("""
                SELECT event, time, medal, pool_length, age, competition,
                       comp_country, result_date
                FROM athlete_personal_bests
                WHERE athlete_ext_id = :ext_id
                ORDER BY event ASC
            """),
            {"ext_id": athlete["external_id"]},
        ).mappings().all()

    return [dict(r) for r in rows]


###################################
# Athlete Detail Ingestion
###################################


class AthleteDetailIn(BaseModel):
    external_id: int
    gold_medals: int | None = None
    silver_medals: int | None = None
    bronze_medals: int | None = None
    discipline: Annotated[str | None, Field(max_length=100)] = None
    height: Annotated[str | None, Field(max_length=20)] = None
    coach: Annotated[str | None, Field(max_length=200)] = None
    club: Annotated[str | None, Field(max_length=200)] = None


@app.post("/ingest/athlete-detail", dependencies=[Depends(verify_api_key)])
def ingest_athlete_detail(detail: AthleteDetailIn):
    """Update an athlete row with scraped detail data (medals, discipline, etc.)."""
    total = (detail.gold_medals or 0) + (detail.silver_medals or 0) + (detail.bronze_medals or 0)
    query = text("""
        UPDATE athletes SET
            gold_medals = COALESCE(:gold_medals, gold_medals),
            silver_medals = COALESCE(:silver_medals, silver_medals),
            bronze_medals = COALESCE(:bronze_medals, bronze_medals),
            medals = :total_medals,
            discipline = COALESCE(:discipline, discipline),
            height = COALESCE(:height, height),
            coach = COALESCE(:coach, coach),
            club = COALESCE(:club, club),
            detail_scraped_at = now()
        WHERE external_id = :external_id
    """)
    with engine.begin() as conn:
        result = conn.execute(query, {
            **detail.model_dump(),
            "total_medals": total if total > 0 else None,
        })
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Athlete not found")
    return {"status": "ok"}


class PersonalBestItem(BaseModel):
    event: Annotated[str, Field(max_length=200)]
    time: Annotated[str, Field(max_length=20)]
    medal: Annotated[str | None, Field(max_length=10)] = None
    pool_length: Annotated[str | None, Field(max_length=5)] = None
    age: int | None = None
    competition: Annotated[str | None, Field(max_length=500)] = None
    comp_country: Annotated[str | None, Field(max_length=10)] = None
    result_date: Annotated[str | None, Field(max_length=20)] = None


class AthletePersonalBestsIn(BaseModel):
    external_id: int
    personal_bests: list[PersonalBestItem]


@app.post("/ingest/athlete-personal-bests", dependencies=[Depends(verify_api_key)])
def ingest_athlete_personal_bests(body: AthletePersonalBestsIn):
    """Upsert personal best results for an athlete."""
    if not body.personal_bests:
        return {"status": "ok", "count": 0}

    query = text("""
        INSERT INTO athlete_personal_bests
            (athlete_ext_id, event, time, medal, pool_length, age, competition, comp_country, result_date)
        VALUES
            (:athlete_ext_id, :event, :time, :medal, :pool_length, :age, :competition, :comp_country, :result_date)
        ON CONFLICT (athlete_ext_id, event, pool_length) DO UPDATE SET
            time = EXCLUDED.time,
            medal = EXCLUDED.medal,
            age = EXCLUDED.age,
            competition = EXCLUDED.competition,
            comp_country = EXCLUDED.comp_country,
            result_date = EXCLUDED.result_date
    """)

    with engine.begin() as conn:
        for pb in body.personal_bests:
            conn.execute(query, {
                "athlete_ext_id": body.external_id,
                **pb.model_dump(),
            })

    return {"status": "ok", "count": len(body.personal_bests)}


###################################
# On-demand Athlete Detail Scraping
###################################


@app.post("/athletes/{slug}/scrape-detail")
def scrape_athlete_detail_on_demand(slug: str):
    """Scrape detail page for a single athlete on demand.

    Used when a user visits a profile that hasn't been scraped yet.
    No auth required — rate limiting should be handled at the proxy level.
    """
    with engine.begin() as conn:
        athlete = conn.execute(
            text("SELECT external_id, slug, detail_scraped_at FROM athletes WHERE slug = :slug"),
            {"slug": slug},
        ).mappings().first()

    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")

    from scrapers.wa_athlete_detail_scrape import scrape_single

    detail = scrape_single(athlete["external_id"], athlete["slug"])
    if not detail:
        raise HTTPException(status_code=502, detail="Failed to scrape athlete page")

    # Store the scraped data directly (bypass HTTP round-trip)
    total = (detail.get("gold_medals") or 0) + (detail.get("silver_medals") or 0) + (detail.get("bronze_medals") or 0)
    with engine.begin() as conn:
        conn.execute(text("""
            UPDATE athletes SET
                gold_medals = COALESCE(:gold, gold_medals),
                silver_medals = COALESCE(:silver, silver_medals),
                bronze_medals = COALESCE(:bronze, bronze_medals),
                medals = :total,
                discipline = COALESCE(:discipline, discipline),
                detail_scraped_at = now()
            WHERE external_id = :ext_id
        """), {
            "gold": detail.get("gold_medals"),
            "silver": detail.get("silver_medals"),
            "bronze": detail.get("bronze_medals"),
            "total": total if total > 0 else None,
            "discipline": detail.get("discipline"),
            "ext_id": athlete["external_id"],
        })

        # Upsert personal bests
        pb_query = text("""
            INSERT INTO athlete_personal_bests
                (athlete_ext_id, event, time, medal, pool_length, age, competition, comp_country, result_date)
            VALUES
                (:athlete_ext_id, :event, :time, :medal, :pool_length, :age, :competition, :comp_country, :result_date)
            ON CONFLICT (athlete_ext_id, event, pool_length) DO UPDATE SET
                time = EXCLUDED.time,
                medal = EXCLUDED.medal,
                age = EXCLUDED.age,
                competition = EXCLUDED.competition,
                comp_country = EXCLUDED.comp_country,
                result_date = EXCLUDED.result_date
        """)
        for pb in detail.get("personal_bests", []):
            conn.execute(pb_query, {
                "athlete_ext_id": athlete["external_id"],
                **pb,
            })

    # Return the updated athlete + personal bests
    with engine.begin() as conn:
        updated = conn.execute(
            text("SELECT * FROM athletes WHERE slug = :slug"),
            {"slug": slug},
        ).mappings().first()
        pbs = conn.execute(
            text("SELECT * FROM athlete_personal_bests WHERE athlete_ext_id = :ext_id ORDER BY event"),
            {"ext_id": athlete["external_id"]},
        ).mappings().all()

    return {
        "athlete": dict(updated),
        "personal_bests": [dict(r) for r in pbs],
    }


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


###################################
# Rankings
###################################


class RankingIn(BaseModel):
    athlete_ext_id: int
    athlete_name: Annotated[str, Field(max_length=200)]
    country_code: Annotated[str | None, Field(max_length=10)] = None
    gender: Annotated[str, Field(max_length=2)]
    distance: int
    stroke: Annotated[str, Field(max_length=30)]
    pool: Annotated[str, Field(max_length=5)]
    rank: int
    time: Annotated[str, Field(max_length=20)]
    fina_points: float | None = None
    event_name: Annotated[str | None, Field(max_length=500)] = None
    event_city: Annotated[str | None, Field(max_length=200)] = None
    result_date: datetime | None = None
    ranking_type: Annotated[str, Field(max_length=20)] = "alltime"


@app.post("/ingest/ranking", dependencies=[Depends(verify_api_key)])
def ingest_ranking(ranking: RankingIn):
    query = text(
        """
        INSERT INTO rankings (athlete_ext_id, athlete_name, country_code, gender,
                              distance, stroke, pool, rank, time, fina_points,
                              event_name, event_city, result_date, ranking_type)
        VALUES (:athlete_ext_id, :athlete_name, :country_code, :gender,
                :distance, :stroke, :pool, :rank, :time, :fina_points,
                :event_name, :event_city, :result_date, :ranking_type)
        ON CONFLICT (athlete_ext_id, gender, distance, stroke, pool, ranking_type) DO UPDATE SET
            athlete_name = EXCLUDED.athlete_name,
            country_code = EXCLUDED.country_code,
            rank = EXCLUDED.rank,
            time = EXCLUDED.time,
            fina_points = EXCLUDED.fina_points,
            event_name = EXCLUDED.event_name,
            event_city = EXCLUDED.event_city,
            result_date = EXCLUDED.result_date;
        """
    )
    with engine.begin() as conn:
        conn.execute(query, ranking.model_dump())
    return {"status": "ok"}


@app.get("/rankings")
def list_rankings(
    gender: Optional[str] = Query(None),
    stroke: Optional[str] = Query(None),
    distance: Optional[int] = Query(None),
    pool: Optional[str] = Query(None),
    ranking_type: Optional[str] = Query("alltime"),
):
    conditions: list[str] = []
    params: dict = {}
    if gender:
        conditions.append("gender = :gender")
        params["gender"] = gender
    if stroke:
        conditions.append("stroke = :stroke")
        params["stroke"] = stroke
    if distance:
        conditions.append("distance = :distance")
        params["distance"] = distance
    if pool:
        conditions.append("pool = :pool")
        params["pool"] = pool
    if ranking_type:
        conditions.append("ranking_type = :ranking_type")
        params["ranking_type"] = ranking_type

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    query = text(f"SELECT * FROM rankings {where} ORDER BY rank ASC, time ASC")
    with engine.begin() as conn:
        rows = conn.execute(query, params).mappings().all()
    return rows


###################################
# Records
###################################


class RecordIn(BaseModel):
    athlete_ext_id: int
    athlete_name: Annotated[str, Field(max_length=200)]
    country_code: Annotated[str | None, Field(max_length=10)] = None
    gender: Annotated[str, Field(max_length=2)]
    distance: int
    stroke: Annotated[str, Field(max_length=30)]
    pool: Annotated[str, Field(max_length=5)]
    time: Annotated[str, Field(max_length=20)]
    fina_points: float | None = None
    event_name: Annotated[str | None, Field(max_length=500)] = None
    event_city: Annotated[str | None, Field(max_length=200)] = None
    result_date: datetime | None = None


@app.post("/ingest/record", dependencies=[Depends(verify_api_key)])
def ingest_record(record: RecordIn):
    query = text(
        """
        INSERT INTO records (athlete_ext_id, athlete_name, country_code, gender,
                             distance, stroke, pool, time, fina_points,
                             event_name, event_city, result_date)
        VALUES (:athlete_ext_id, :athlete_name, :country_code, :gender,
                :distance, :stroke, :pool, :time, :fina_points,
                :event_name, :event_city, :result_date)
        ON CONFLICT (gender, distance, stroke, pool) DO UPDATE SET
            athlete_ext_id = EXCLUDED.athlete_ext_id,
            athlete_name = EXCLUDED.athlete_name,
            country_code = EXCLUDED.country_code,
            time = EXCLUDED.time,
            fina_points = EXCLUDED.fina_points,
            event_name = EXCLUDED.event_name,
            event_city = EXCLUDED.event_city,
            result_date = EXCLUDED.result_date;
        """
    )
    with engine.begin() as conn:
        conn.execute(query, record.model_dump())
    return {"status": "ok"}


@app.get("/records")
def list_records(
    gender: Optional[str] = Query(None),
    pool: Optional[str] = Query(None),
):
    conditions: list[str] = []
    params: dict = {}
    if gender:
        conditions.append("gender = :gender")
        params["gender"] = gender
    if pool:
        conditions.append("pool = :pool")
        params["pool"] = pool

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    query = text(
        f"SELECT * FROM records {where} ORDER BY gender, stroke, distance ASC"
    )
    with engine.begin() as conn:
        rows = conn.execute(query, params).mappings().all()
    return rows
