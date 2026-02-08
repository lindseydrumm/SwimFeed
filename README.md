# Swim Live

Swim Live is an application designed to make competitive swimming easier to follow by aggregating news, tracking upcoming events, and delivering a personalized feed for users.

This repository contains the full Swim Live project:

- **Backend:** Data ingestion, scrapers, database models, and APIs
- **ReactProject:** React Native mobile app (iOS & Android)
- **web:** React web app (Vite)

---

## Repository structure

| Directory     | Description                    |
|--------------|--------------------------------|
| `Backend/`   | Python backend (FastAPI, uv)   |
| `web/`       | React web app (Vite)           |

---

## Backend

### Architecture

The backend is built with a focus on simplicity, reproducibility, and extensibility.

**Tech stack:** Python, `uv`, PostgreSQL, FastAPI, Python-based scrapers.

- **Scrapers:** Collect news, events, and results from external sources
- **Database layer:** PostgreSQL schemas and models
- **API layer:** FastAPI endpoints for web and mobile clients
- **Business logic:** Aggregation, filtering, and personalization

### Backend setup

**Prerequisites:** Python 3.12, [uv](https://github.com/astral-sh/uv), PostgreSQL (local or containerized).

```bash
cd Backend
uv venv
uv sync
```

To run a Python script:

```bash
uv run main.py
```

### Database (PostgreSQL)

You need:

- A running PostgreSQL instance
- A database created for the project

### API

> TODO: add full app startup instructions

Once implemented, the API will be runnable locally via:

```bash
cd Backend
uv run uvicorn app.main:app --reload
```

---

## Web app

React (Vite) web client.

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
