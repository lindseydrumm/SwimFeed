-- docker-init/init_tables.sql
-- --------------- users ------------------
CREATE TABLE IF NOT EXISTS users (
    id                  SERIAL PRIMARY KEY,
    clerk_id            TEXT UNIQUE NOT NULL,
    display_name        TEXT DEFAULT '',
    goals               JSONB DEFAULT '[]',
    interests           JSONB DEFAULT '{}',
    digest_preference   TEXT DEFAULT 'daily',
    onboarding_complete BOOLEAN DEFAULT FALSE,
    follows             JSONB DEFAULT '{"athletes":[],"events":[],"topics":[],"storylines":[]}',
    saved_articles      JSONB DEFAULT '[]',
    seen_articles       JSONB DEFAULT '[]',
    last_visit_at       TIMESTAMPTZ,
    streak_count        INTEGER DEFAULT 0,
    learn_completions   JSONB DEFAULT '[]',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
-- --------------- athletes ---------------
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
-- --------------- articles ---------------
CREATE TABLE IF NOT EXISTS articles (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    url           TEXT UNIQUE NOT NULL,
    published_at  TIMESTAMP,
    summary       TEXT,
    source        TEXT NOT NULL
);
-- --------------- events -----------------
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
