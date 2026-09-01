# SwimLive

SwimLive is a competitive swimming aggregation platform that makes the sport easier to follow. It aggregates news from major swimming publications, tracks upcoming events from World Aquatics and USA Swimming, surfaces athlete profiles, and delivers a personalized feed based on user preferences.

This is a dual-app repository:

- **Backend/** — Python FastAPI backend with PostgreSQL
- **web/** — React single-page application built with Vite

---

## Deployment

The deployed application is available at: https://swimfeed.com/

## Tech Stack

**Backend:** Python 3.12, FastAPI, PostgreSQL 15, SQLAlchemy (raw SQL), Pydantic, uv, PyJWT

**Frontend:** React 19, Vite 7, TypeScript, Tailwind CSS 3.4, framer-motion, react-router-dom, Clerk

**Infrastructure:** Docker Compose, Render (deployment)

---

## Repository Structure

| Path | Description |
|------|-------------|
| `Backend/` | FastAPI backend, scrapers, and Dockerfile |
| `Backend/scrapers/` | Data scrapers (RSS feeds, World Aquatics API, USA Swimming) |
| `web/` | React SPA frontend |
| `web/components/` | Shared presentational components |
| `web/src/` | App source: routes, API client, state management, types |
| `web/src/hooks/` | Custom hooks including `useGuestGate` |
| `web/src/repositories/` | Data layer: `ApiUserRepository` (DB), `LocalUserRepository` (localStorage) |
| `docker-compose.yml` | Local dev services (PostgreSQL + backend) |
| `docker-init/` | SQL scripts for database initialization |
| `.env.example` | Backend environment variable template |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 18+ and npm

---

## Authentication Setup (Clerk)

SwimLive uses [Clerk](https://clerk.com) for authentication. Each developer needs their own free Clerk app for local development.

### 1. Create a Clerk app

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and sign in
2. Click **Create application**, name it anything (e.g. `swimlive-dev`)
3. Choose your preferred sign-in methods (Email, Google, etc.)

### 2. Configure the frontend

Create `web/.env.local` (this file is gitignored — never commit it):

```bash
# web/.env.local
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

Your publishable key is on the **API Keys** page of your Clerk app dashboard.

### 3. Configure the backend

The root `.env` file needs the Clerk JWKS URL so the backend can verify JWTs.

Your JWKS URL follows this pattern:
```
https://<your-clerk-domain>/.well-known/jwks.json
```

Find your Clerk domain on the **API Keys** page — it's shown under **Advanced**. Or derive it from your publishable key: the part after `pk_test_` is base64 — decoding it gives your domain.

Add it to `.env`:

```bash
CLERK_JWKS_URL=https://YOUR-CLERK-DOMAIN.clerk.accounts.dev/.well-known/jwks.json
```

### 4. Verify

Run the app (see below). Clicking **Sign in** in the navbar should open your Clerk modal. After signing in, the app runs onboarding and then persists all activity to the database.

---

## Environment Setup

Copy the environment template:

```bash
cp .env.example .env
```

Then add your `CLERK_JWKS_URL` as described above. The other defaults work out of the box with Docker Compose.

---

## Starting the App

### Backend (Docker)

From the repository root:

```bash
docker compose up --build
```

This starts PostgreSQL 15 and the FastAPI backend with hot reload. The API is available at http://localhost:8000.

```bash
docker compose logs backend    # view logs
```

### Frontend

In a separate terminal:

```bash
cd web
npm install
npm run dev
```

The app is available at http://localhost:5173.

---

## Guest vs Signed-In Access

| Feature | Guest | Signed In |
|---------|-------|-----------|
| Browse events, athletes, storylines, records | Yes | Yes |
| View Explore, Learn modules, quizzes | Yes | Yes |
| Follow athletes / events | No — opens sign-in | Yes, persisted to DB |
| Save articles, mark as read | No — opens sign-in | Yes, persisted to DB |
| My Feed personalization | Basic view | Fully personalized |
| Edit profile / settings | No — opens sign-in | Yes, persisted to DB |
| Streak tracking, learn completions | No | Yes, persisted to DB |
| Onboarding flow | Not required | Required on first sign-in |

Guests who click any protected action are shown the Clerk sign-in modal automatically.

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/articles` | List all articles, newest first |
| `GET` | `/athletes` | Search/list athletes (`q`, `country`, `limit`, `offset`) |
| `GET` | `/athletes/countries` | Top 20 country codes |
| `GET` | `/athletes/{slug}` | Single athlete |
| `POST` | `/athletes/batch` | Batch fetch by slug list |
| `GET` | `/events` | List all events |

### User profile (requires `Authorization: Bearer <clerk_token>`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/me` | Get full user state (creates user on first call) |
| `POST` | `/me/onboarding` | Save onboarding profile |
| `PATCH` | `/me` | Update display name or digest preference |
| `POST` | `/me/follow` | Follow an athlete, event, topic, or storyline |
| `DELETE` | `/me/follow/{type}/{id}` | Unfollow |
| `POST` | `/me/saved` | Save an article |
| `DELETE` | `/me/saved/{urlOrId}` | Unsave an article |
| `POST` | `/me/seen` | Mark article as read |
| `POST` | `/me/visit` | Touch visit timestamp / update streak |
| `POST` | `/me/learn/{moduleId}` | Mark a learn module complete |
| `POST` | `/me/reset` | Reset all user data |

### Ingestion (requires `X-API-Key` header if `INGEST_API_KEY` is set)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ingest/article` | Ingest an article |
| `POST` | `/ingest/athlete` | Upsert an athlete |
| `POST` | `/ingest/event` | Ingest an event |

---

## Scrapers

Scrapers collect data from external sources and push it to the backend via the ingest endpoints.

Run all scrapers:

```bash
docker exec swimlive_backend uv run -m scrapers.run_all
```

> **Warning:** The athlete scraper takes a long time — ~30 min locally, 3+ hours to a remote server. To test quickly, set `total_pages` on line 32 of `Backend/scrapers/wa_athletes_scrape.py` to a small value like `10`.

Individual scrapers:

| Scraper | Source | Command |
|---------|--------|---------|
| RSS News | SwimSwam, SwimmingWorld, BBC Sport | `docker exec swimlive_backend uv run scrapers/rss_scrape.py` |
| World Aquatics Events | World Aquatics API | `docker exec swimlive_backend uv run scrapers/wa_events_scrape.py` |
| USA Swimming Events | usaswimming.org | `docker exec swimlive_backend uv run scrapers/usaswim_events_scrape.py` |
| World Aquatics Athletes | World Aquatics API | `docker exec swimlive_backend uv run scrapers/wa_athletes_scrape.py` |

---

## Frontend Scripts

```bash
npm run dev       # Start Vite dev server (port 5173)
npm run build     # Production build (output: web/dist/)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

---

*Note: The free-tier server spins down after 15 minutes of inactivity. Initial visits may take 1–5 minutes to load.*
