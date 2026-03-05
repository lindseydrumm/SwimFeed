"""
scrape_athletes.py

Seed the athletes table by gathering swimmer metadata from multiple sources
and POSTing to the FastAPI backend at /ingest/athlete.

For now this uses curated data to keep things reliable in development – you
can later replace the static lists with real scrapers that fetch and parse
remote pages (using requests, feedparser, etc.).
"""

from __future__ import annotations

import requests

API_URL = "http://127.0.0.1:8000/ingest/athlete"


SOURCES: list[dict] = [
    {
        "source": "worldaquatics_featured",
        "athletes": [
            {
                "slug": "leon-marchand",
                "name": "Léon Marchand",
                "country": "FRA",
                "flag": "🇫🇷",
                "strokes": "IM, Butterfly",
                "bio": "French medley star pushing the limits in 200/400 IM.",
                "medals": 8,
                "world_records": 2,
                "world_rank": 1,
            },
            {
                "slug": "katie-ledecky",
                "name": "Katie Ledecky",
                "country": "USA",
                "flag": "🇺🇸",
                "strokes": "Freestyle",
                "bio": "Distance freestyle legend with multiple Olympic and World titles.",
                "medals": 15,
                "world_records": 3,
                "world_rank": 1,
            },
        ],
    },
    {
        "source": "usaswimming_spotlight",
        "athletes": [
            {
                "slug": "caeleb-dressel",
                "name": "Caeleb Dressel",
                "country": "USA",
                "flag": "🇺🇸",
                "strokes": "Sprint Free, Butterfly",
                "bio": "American sprint star known for explosive 50/100m races.",
                "medals": 10,
                "world_records": 2,
                "world_rank": 2,
            },
            {
                "slug": "summer-mcintosh",
                "name": "Summer McIntosh",
                "country": "CAN",
                "flag": "🇨🇦",
                "strokes": "Freestyle, IM",
                "bio": "Versatile Canadian phenom across mid-distance and IM.",
                "medals": 6,
                "world_records": 1,
                "world_rank": 2,
            },
        ],
    },
]


def main() -> None:
    for source in SOURCES:
        label = source["source"]
        for athlete in source["athletes"]:
            payload = {
                "slug": athlete["slug"],
                "name": athlete["name"],
                "country": athlete.get("country"),
                "flag": athlete.get("flag"),
                "strokes": athlete.get("strokes"),
                "bio": athlete.get("bio"),
                "medals": athlete.get("medals"),
                "world_records": athlete.get("world_records"),
                "world_rank": athlete.get("world_rank"),
            }

            print(f"[{label}] Ingesting {payload['name']}...")
            resp = requests.post(API_URL, json=payload, timeout=10)
            print(f"  -> {resp.status_code} {resp.text[:120]}")


if __name__ == "__main__":
    main()

