-- docker-init/init_tables.sql
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
