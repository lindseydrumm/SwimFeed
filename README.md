# Swim Live

Swim Live is an application designed to make competitive swimming easier to follow by aggregating news, tracking upcoming events, and delivering a personalized feed for users.

This repository contains the full Swim Live project:

- **Backend:** Data ingestion, scrapers, database models, and APIs
- **web:** React web app (Vite)

---

## Repository structure

| Directory     | Description                    |
|--------------|--------------------------------|
| `Backend/`   | Python backend (FastAPI, uv)   |
| `web/`       | React web app (Vite)           |
| `docker-compose.yml` | Local development services (DB + backend) |

---

## Backend

### Architecture

The backend is built with a focus on simplicity, reproducibility, and extensibility.

**Tech stack:** Python, uv, PostgreSQL, FastAPI, Python-based scrapers, Docker

- **Scrapers:** Collect news, events, and results from external sources
- **Database layer:** PostgreSQL schemas and models
- **API layer:** FastAPI endpoints for web and mobile clients
- **Business logic:** Aggregation, filtering, and personalization

### Backend setup

**Prerequisites:** Docker

After cloning the repository:

```bash
docker compose up
```
This will:
    - Start PostgreSQL
    - Start the FastAPI backend
    - Mount the Backend/ directory into the container
    - Enable hot reload for backend code changes

The API is available at:
```
http://localhost:8000
```

To run a backend script:

```bash
docker exec swimlive_backend uv run <script>.py
```

### API

The API is automatically started when Docker Compose runs. If the API fails to start, check logs with:
```bash
docker compose logs backend
```

---

## Web app

The React (Vite) web client is not Dockerized and runs locally.

```bash
cd web
npm install
npm run dev
```

Then open the URL shown (e.g. http://localhost:5173).

---

## Deployment

TODO: how to deploy the project

## Authors

TODO: list of authors

## Acknowledgments
