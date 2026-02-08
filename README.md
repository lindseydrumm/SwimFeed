# Swim Live Backend

Swim Live is an application designed to make competitive swimming easier to follow by aggregating news, tracking upcoming events, and delivering a personalized feed for users.

This repository contains the backend services for Swim Live, including:
- Data ingestion and web scrapers
- Database models and persistence
- Core backend logic and APIs

---

## Architecture

The backend is built with a focus on simplicity, reproducibility, and extensibility.

### Tech Stack

- **Language:** Python
- **Dependency Management:** `uv` for fast, reproducible Python environments
- **Database:** PostgreSQL for structured data storage and extensibility
- **Web Scraping:** Python-based scrapers for ingesting swimming-related data
- **API Layer:** FastAPI for high-performance, secure REST APIs

### High-Level Structure

- **Scrapers:** Responsible for collecting news, events, and results from external sources
- **Database Layer:** PostgreSQL schemas and models for storing ingested and user-related data
- **API Layer:** FastAPI application exposing endpoints for clients (web/mobile)
- **Business Logic:** Aggregation, filtering, and personalization logic shared across services

---

## Setup

### Prerequisites

- Python 3.12
- `uv` installed (https://github.com/astral-sh/uv)
- PostgreSQL (local or containerized)

### Local Development

Clone the repository and set up the virtual environment:

```bash
git clone https://github.com/dartmouth-cs98/swim-live-backend.git
cd swim-live-backend

uv venv
uv sync
```

To run a Python script:

```bash
uv run example.py
```

### Database Setup (PostgreSQL)
At minimum, you will need:
- A running PostgreSQL instance
- A databased created for the project

### API Setup
> TODO: add full app startup instructions

Once impemented, the API will be runnable locally via:
```bash
uv run uvicorn app.main:app --reload
```

## Deployment

TODO: how to deploy the project

## Authors

TODO: list of authors

## Acknowledgments
