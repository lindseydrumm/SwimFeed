# Swim Live — Full Project Snapshot

A single reference for the current state of the project so you can build from it. Generated as a point-in-time snapshot.

---

## 1. Project overview

- **Name:** Swim Live / SwimStats (brand in UI)
- **Purpose:** Aggregate swimming news, track upcoming events, deliver a personalized feed.
- **Stack:** React (Vite) frontend, FastAPI (Python) backend, PostgreSQL, Docker.

---

## 2. Repository structure

```
project-swim-live/
├── Backend/                 # Python API + scrapers
│   ├── main.py              # FastAPI app, DB, /articles & /ingest/article
│   ├── scrape.py            # RSS scraper → POST to ingest
│   ├── Dockerfile           # uv, uvicorn
│   ├── pyproject.toml       # deps: fastapi, feedparser, psycopg2-binary, requests, sqlalchemy, uvicorn
│   └── uv.lock
├── web/                     # React SPA
│   ├── src/
│   │   ├── main.jsx        # React root, BrowserRouter, App
│   │   ├── App.jsx         # Layout, Header, footer, Routes
│   │   ├── App.tsx         # (present; App.jsx is used)
│   │   ├── index.css       # global styles
│   │   └── api/
│   │       ├── client.ts   # BASE_URL, apiGet<T>
│   │       └── articles.ts # Article type, getArticles()
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── WelcomeBanner.tsx
│   │   ├── YourAthletes.tsx
│   │   ├── UpcomingRaces.tsx
│   │   ├── NewsFeed.tsx
│   │   ├── RecentResults.tsx
│   │   ├── EventPage.tsx
│   │   ├── SwimmerPage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── AthletesToWatch.tsx  # (exists; not in current App.jsx routes)
│   │   └── ui/
│   │       ├── Card.tsx     # Card, CardHeader, CardTitle, CardContent
│   │       └── Badge.tsx    # Badge variants
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── docker-compose.yml       # db (Postgres) + backend
├── README.md
└── PROJECT_SNAPSHOT.md     # this file
```

---

## 3. Backend

### 3.1 Tech

- **Runtime:** Python (uv, pyproject.toml requires >=3.12; Dockerfile uses 3.11-slim).
- **API:** FastAPI.
- **DB:** PostgreSQL 15 (Alpine). SQLAlchemy `create_engine`, raw SQL with `text()`.
- **Scraper:** feedparser + requests; runs as script inside backend container.

### 3.2 Database

- **Connection (inside Docker):** `postgresql+psycopg2://dev:dev@db:5432/swimlive`
- **Containers:** `swimlive_db` (Postgres), `swimlive_backend` (FastAPI).
- **Tables (in code):** Only `articles` is used. Schema is implied by INSERT:
  - `id` (assumed SERIAL PRIMARY KEY if you add schema)
  - `title` TEXT NOT NULL
  - `url` TEXT NOT NULL UNIQUE (used for ON CONFLICT)
  - `published_at` TIMESTAMPTZ (nullable)
  - `summary` TEXT (nullable)
  - `source` TEXT NOT NULL

There is no migration or `CREATE TABLE` in the repo; you may need to add one so the table exists on first run.

### 3.3 API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/articles` | List all articles, newest first. Returns array of rows (id, title, url, published_at, summary, source). |
| POST | `/ingest/article` | Insert one article. Body: `ArticleIn` (title, url, published_at, summary, source). `ON CONFLICT (url) DO NOTHING`. |

**ArticleIn (Pydantic):** `title: str`, `url: str`, `published_at: datetime | None`, `summary: str | None`, `source: str`.

### 3.4 CORS

- `allow_origins`: `["http://localhost:5173"]` (add `http://localhost:5174` if Vite uses that port).
- `allow_credentials`: true. `allow_methods` / `allow_headers`: `*`.

### 3.5 Scraper (`scrape.py`)

- **Run:** `docker exec swimlive_backend uv run scrape.py`
- **Target:** `POST http://127.0.0.1:8000/ingest/article` (same container).
- **Sources (RSS):**
  - swimswam: `https://swimswam.com/feed/`
  - worldaquatics: `https://www.worldaquatics.com/news/rss`
  - usaswimming: `https://www.usaswimming.org/news/rss`
  - swimmingworld: `https://www.swimmingworldmagazine.com/news/feed/`
- **Payload per entry:** title, link→url, published_parsed→published_at (ISO), summary, source name. No return value; prints status per article.

---

## 4. Frontend (web)

### 4.1 Tech

- **Build:** Vite 7, React 19, react-router-dom 7.
- **Styling:** Tailwind CSS. Dark theme: `bg-slate-900`, `text-slate-300`, cyan accents (`text-cyan-400`, `bg-cyan-500/10`), slate cards (`bg-slate-800/50`, `border-slate-700/50`).
- **UI libs:** lucide-react (icons), framer-motion (motion), clsx + tailwind-merge (cn), no separate component library.

### 4.2 Entry and routing

- **Entry:** `main.jsx` → `BrowserRouter` → `App.jsx`.
- **App layout:** Sticky `Header`, `main` (container, max-w-6xl), footer.
- **Routes (in App.jsx):**

| Path | Content |
|------|---------|
| `/` | Home: WelcomeBanner, YourAthletes, UpcomingRaces, grid(NewsFeed | RecentResults) |
| `/events` | EventPage (World Aquatics Championships detail: schedule, broadcast, storylines, swimmers) |
| `/athletes` | SwimmerPage (single athlete profile: Michael Phelps – about, stats, recent results, upcoming races) |
| `/explore` | ExplorePage (search placeholder, category chips, article cards with images) |

### 4.3 API usage

- **Base URL:** `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"`.
- **Used in app:** Only `getArticles()` from `src/api/articles.ts` → `GET /articles`. Used by `NewsFeed`; fallback to fake data if request fails or empty.

### 4.4 Components (summary)

| Component | Location | Data | Notes |
|-----------|----------|------|--------|
| Header | `components/Header.tsx` | Static | Logo (NavLink `/`), nav: My Feed (/), Athletes (/athletes), Events (/events), Explore (/explore). Avatar "JD". |
| WelcomeBanner | `components/WelcomeBanner.tsx` | Static | "Welcome back, Jordan", "5 athletes", "2 upcoming races". |
| YourAthletes | `components/YourAthletes.tsx` | Static array | Horizontal list of 6 athletes (name, country, flag, event, initials) + "Add Athlete". |
| UpcomingRaces | `components/UpcomingRaces.tsx` | Static array | Featured event card (World Aquatics, Budapest 2025) + list of heats (event, athlete, date, time, round). Links to `/events`. |
| NewsFeed | `components/NewsFeed.tsx` | API + fallback | `getArticles()`. Renders title, summary (strip HTML), source badge, date, optional image from summary; link to url. Falls back to fake_news if error or empty. |
| RecentResults | `components/RecentResults.tsx` | Static array | List of results (athlete, event, place, time, diff, date). "View all results" button. |
| EventPage | `components/EventPage.tsx` | Static | One event: hero, How to Watch, About, Storylines, Featured Swimmers, expandable Event Schedule. Follow button (local state). |
| SwimmerPage | `components/SwimmerPage.tsx` | Static | One athlete: avatar, name, badges (USA, Butterfly, IM), Follow, About, stats grid (medals, records, rank), Recent Results list, Upcoming Races cards. |
| ExplorePage | `components/ExplorePage.tsx` | Static | Title, search input, category chips, grid of 6 article cards (image, category, title) with Unsplash URLs. |
| AthletesToWatch | `components/AthletesToWatch.tsx` | Static | Not mounted in current App; 4 athletes with PB, WR, trend, mini line chart (recharts). |

### 4.5 UI primitives

- **Card** (`ui/Card.tsx`): `Card`, `CardHeader`, `CardTitle`, `CardContent`. Props: `className`, `animate`, `delay`. Base: slate-800/50, border, rounded-xl, optional motion.
- **Badge** (`ui/Badge.tsx`): Variants `default` | `outline` | `secondary` | `accent` | `success` | `warning`. Small rounded pill.

### 4.6 Design tokens (conceptual)

- **Background:** `bg-slate-900`, cards `bg-slate-800/50`, borders `border-slate-700/50`.
- **Text:** headings `text-white`, body `text-slate-300` / `text-slate-400`, muted `text-slate-500`.
- **Accent:** `text-cyan-400`, `bg-cyan-500/10`, `border-cyan-500/20` (or /30 for hover).
- **Icons:** lucide-react; names without "Icon" suffix (e.g. `Calendar`, `MapPin`, `Trophy`).

---

## 5. Docker and run

### 5.1 docker-compose.yml (current)

- **db:** image `postgres:15-alpine`, container `swimlive_db`, user/pass/db: dev/dev/swimlive, port `5432:5432`, volume `postgres_data`.
- **backend:** build `./Backend`, container `swimlive_backend`, `env_file: .env`, depends_on db, port `8000:8000`, volume `./Backend:/app`.

Note: If `.env` is missing, compose may fail; you can remove `env_file` or add an empty `.env` if needed.

### 5.2 How to run

1. **Backend + DB:** From repo root: `docker compose up --build`. API: http://localhost:8000.
2. **Scraper (optional):** `docker exec swimlive_backend uv run scrape.py`.
3. **Web:** `cd web && npm install && npm run dev`. Open URL shown (e.g. http://localhost:5173).

---

## 6. Data shapes (for building APIs/features)

### 6.1 Article (backend + frontend)

- **Backend (DB/API):** id, title, url, published_at, summary, source.
- **Frontend (`Article` in articles.ts / NewsFeed):** id?, title, url, published_at, summary, source.

### 6.2 Static data you might turn into APIs

- **Athletes (YourAthletes / SwimmerPage):** name, country, flag/emoji, event(s), initials; profile: about, stats (medals, records, rank), recent results, upcoming races.
- **Events (UpcomingRaces / EventPage):** name, location, date range, featured; heats: event, athlete, date, time, round; broadcast: session, time, platform, region.
- **Results (RecentResults):** athlete, event, place, time, diff vs PB or WR, date.
- **Explore:** categories (Technique, Nutrition, Training, Gear, Mental Game, History); items: title, category, image URL.

---

## 7. Suggested next steps (from snapshot)

1. **DB:** Add `CREATE TABLE IF NOT EXISTS articles (...)` (and optional migrations) so backend starts cleanly.
2. **CORS:** Add `http://localhost:5174` if you use that port for Vite.
3. **Optional .env:** Add `.env.example` or remove `env_file` from compose so `docker compose up` works without a local `.env`.
4. **CRUD:** Extend articles (filters, pagination, GET by id, update/delete); add resources for athletes, events, results, follows when you need them (see PROJECT_SNAPSHOT or prior CRUD suggestions).
5. **Frontend:** Replace static arrays in YourAthletes, UpcomingRaces, RecentResults, EventPage, SwimmerPage, ExplorePage with API calls when backend endpoints exist.
6. **Auth/users:** None yet; "Jordan" and "5 athletes / 2 races" are static. Add users and follow relationships when you want real personalization.

---

## 8. File manifest (key files only)

| Path | Role |
|------|------|
| `Backend/main.py` | FastAPI app, CORS, engine, ArticleIn, GET /articles, POST /ingest/article |
| `Backend/scrape.py` | RSS sources, feedparser loop, POST to /ingest/article |
| `Backend/Dockerfile` | Python, uv, uvicorn main:app --reload |
| `Backend/pyproject.toml` | fastapi, feedparser, psycopg2-binary, requests, sqlalchemy, uvicorn |
| `docker-compose.yml` | db (postgres:15-alpine), backend (build Backend, env_file .env) |
| `web/src/main.jsx` | React root, BrowserRouter, App |
| `web/src/App.jsx` | Routes /, /events, /athletes, /explore; layout |
| `web/src/api/client.ts` | BASE_URL, apiGet |
| `web/src/api/articles.ts` | Article type, getArticles() |
| `web/components/Header.tsx` | Nav + logo |
| `web/components/NewsFeed.tsx` | getArticles(), fallback mock, card list |
| `web/components/ui/Card.tsx` | Card, CardHeader, CardTitle, CardContent |
| `web/components/ui/Badge.tsx` | Badge variants |
| `web/package.json` | react, react-router-dom, vite, tailwind, framer-motion, lucide-react, etc. |

Use this snapshot as the single source of truth for "what exists and how it works" when building new features or onboarding.
