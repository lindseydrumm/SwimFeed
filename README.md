# SwimLive

SwimLive is a competitive swimming aggregation platform that makes the sport easier to follow. It aggregates news from major swimming publications, tracks upcoming events from World Aquatics and USA Swimming, surfaces athlete profiles, and delivers a personalized feed based on user preferences.

This is a dual-app repository:

- **Backend/** -- Python FastAPI backend with PostgreSQL
- **web/** -- React single-page application built with Vite

---

## Tech Stack

**Backend:** Python 3.12, FastAPI, PostgreSQL 15, SQLAlchemy (raw SQL), Pydantic, uv

**Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS 3.4, framer-motion, react-router-dom

**Infrastructure:** Docker Compose, Render (deployment)

---

## Repository Structure

| Path | Description |
|------|-------------|
| `Backend/` | FastAPI backend, scrapers, and Dockerfile |
| `Backend/scrapers/` | Data scrapers (RSS feeds, World Aquatics API, USA Swimming) |
| `web/` | React SPA frontend |
| `web/components/` | Shared presentational components (Card, Badge, etc.) |
| `web/src/` | App source: routes, API client, state management, types |
| `docker-compose.yml` | Local dev services (PostgreSQL + backend) |
| `docker-init/` | SQL scripts for database initialization |
| `.env.example` | Environment variable template |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 18+ and npm

### Environment Setup

Copy the environment template and adjust if needed:

```bash
cp .env.example .env
```

The defaults work out of the box with Docker Compose (database credentials: `dev/dev`, database name: `swimlive`).

### Start the Backend

From the repository root:

```bash
docker compose up --build
```

This will:
- Start PostgreSQL 15 and run the schema initialization script
- Build and start the FastAPI backend with hot reload
- Mount the `Backend/` directory into the container for live code changes

The API will be available at http://localhost:8000.

To check backend logs:

```bash
docker compose logs backend
```

### Start the Frontend

In a separate terminal:

```bash
cd web
npm install
npm run dev
```

The app will be available at http://localhost:5173.

The frontend reads `VITE_API_BASE_URL` from the environment (defaults to `http://localhost:8000`).

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/articles` | List all articles, newest first |
| `POST` | `/ingest/article` | Ingest a single article |
| `GET` | `/athletes` | Search/list athletes (params: `q`, `country`, `limit`, `offset`) |
| `GET` | `/athletes/countries` | Top 20 country codes by athlete count |
| `GET` | `/athletes/{slug}` | Single athlete by slug |
| `POST` | `/athletes/batch` | Batch fetch athletes by slug list |
| `POST` | `/ingest/athlete` | Upsert an athlete by external_id |
| `GET` | `/events` | List all events, ordered by date |
| `POST` | `/ingest/event` | Ingest a single event |

CORS is configured to allow `http://localhost:5173` (the frontend dev server).

---

## Scrapers

Scrapers collect data from external sources and push it to the backend via the ingest endpoints.

Run all scrapers:

```bash
docker exec swimlive_backend uv run -m scrapers.run_all
```

> **Warning:** The athlete scraper (included in `run_all`) takes a long time to complete -- roughly 30 minutes when posting to a local server, and 3+ hours when posting to a remote server. To quickly test how the scraper works, you can set `total_pages` on line 32 of `Backend/scrapers/wa_athletes_scrape.py` to a small value like `10`.

Individual scrapers:

| Scraper | Source | Command |
|---------|--------|---------|
| RSS News | SwimSwam, SwimmingWorld, BBC Sport | `docker exec swimlive_backend uv run scrapers/rss_scrape.py` |
| World Aquatics Events | World Aquatics API | `docker exec swimlive_backend uv run scrapers/wa_events_scrape.py` |
| USA Swimming Events | usaswimming.org | `docker exec swimlive_backend uv run scrapers/usaswim_events_scrape.py` |
| World Aquatics Athletes | World Aquatics API | `docker exec swimlive_backend uv run scrapers/wa_athletes_scrape.py` |

---

## Frontend

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Personalized feed (requires onboarding) |
| `/onboarding` | Onboarding | New user setup flow |
| `/events` | Events | Browse upcoming events |
| `/events/:id` | Event Detail | Single event details |
| `/athletes` | Athletes | Search and browse athletes |
| `/athletes/:slug` | Athlete Detail | Individual athlete profile |
| `/explore` | Explore | Discover content by category |
| `/storylines` | Storylines | Curated swimming storylines |
| `/saved` | Saved | User's saved content |
| `/learn` | Learn | Educational swimming content |
| `/recap` | Recap | Activity recap |
| `/settings` | Settings | User preferences |

### Scripts

```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # Production build (output: web/dist/)
npm run lint      # ESLint (targets .js/.jsx files only)
npm run preview   # Preview production build locally
```

---

## Running the Backend Locally (without Docker)

If you prefer to run the backend outside of Docker, you'll need PostgreSQL running locally and [uv](https://docs.astral.sh/uv/) installed:

```bash
cd Backend
uv sync --frozen
uv run uvicorn main:app --reload
```

Make sure `DATABASE_URL` in your environment points to your local PostgreSQL instance (default: `postgresql+psycopg2://dev:dev@localhost:5432/swimlive`).

---

## Deployment

The deployed application is available at: https://swimlive.onrender.com/

*Note: The free-tier server spins down after 15 minutes of inactivity. Initial visits may take 1-5 minutes to load while the server starts up.*
