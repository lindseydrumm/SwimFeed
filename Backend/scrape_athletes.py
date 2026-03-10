"""
scrape_athletes.py

Seed the athletes table by scraping sources and POSTing to the backend.

- Run from host: cd Backend && uv run scrape_athletes.py (uses localhost:8000)
- Run via docker exec: uses host.docker.internal:8000 to reach backend via published port
- Override: API_BASE_URL=http://... uv run scrape_athletes.py
"""

from __future__ import annotations

import os
import requests
from bs4 import BeautifulSoup


def _api_base() -> str:
    if os.environ.get("API_BASE_URL"):
        return os.environ.get("API_BASE_URL", "").rstrip("/")
    if os.path.exists("/.dockerenv"):
        return "http://host.docker.internal:8000"
    return "http://localhost:8000"


API_BASE_URL = _api_base()
API_URL = f"{API_BASE_URL}/ingest/athlete"


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


def ingest(payload: dict, label: str) -> None:
    print(f"[{label}] Ingesting {payload['name']}...")
    resp = requests.post(API_URL, json=payload, timeout=15)
    print(f"  -> {resp.status_code} {resp.text[:120]}")


def scrape_worldaquatics_featured() -> list[dict]:
    """
    Fetch athletes from World Aquatics API (the HTML page loads data via JS).
    """
    base_url = "https://api.worldaquatics.com/fina/athletes"
    label = "worldaquatics_featured"
    athletes: list[dict] = []
    seen: set[str] = set()

    for page in range(1, 4):  # first 3 pages
        try:
            resp = requests.get(
                base_url,
                params={"pageSize": 100, "page": page},
                headers={"Accept": "application/json"},
                timeout=20,
            )
            resp.raise_for_status()
        except Exception as exc:  # noqa: BLE001
            print(f"[{label}] Failed page {page}: {exc}")
            break

        data = resp.json()
        for entry in data.get("content") or []:
            name = (entry.get("fullName") or "").strip()
            if not name:
                continue
            if entry.get("disciplines") and "SW" not in entry.get("disciplines", []):
                continue
            slug = slugify(name)
            if slug in seen:
                continue
            seen.add(slug)
            athletes.append({
                "slug": slug,
                "name": name,
                "country": (entry.get("nationality") or "").strip() or None,
                "flag": None,
                "strokes": None,
                "bio": None,
                "medals": None,
                "world_records": None,
                "world_rank": None,
            })

    print(f"[{label}] Parsed {len(athletes)} athletes from {base_url}")
    return athletes


def scrape_usaswimming_spotlight() -> list[dict]:
    """
    Scrape USA Swimming's national team / athlete spotlight page.

    Like the World Aquatics scraper, this uses loose selectors to avoid
    being brittle. It looks for cards or links that contain swimmer names.
    """
    url = "https://www.usaswimming.org/meet-the-team/national-team"
    label = "usaswimming_spotlight"
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        print(f"[{label}] Failed to fetch {url}: {exc}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    athletes: list[dict] = []

    # Heuristic: names often appear inside cards or figure captions.
    # We further filter for things that look like \"First Last\" or \"First M Last\"
    # and avoid generic nav / section labels.
    STOP_WORDS = {
        "Home", "Events", "Tickets", "Shop", "Resources", "Parents", "Times",
        "Standards", "Records", "Results", "Information", "Coaches", "Officials",
        "Summit", "Governance", "Services", "Programs", "Team", "Club", "Database",
        "Archive", "Recognition", "Incentive", "Login", "Register",
        "Safe", "Sport", "View", "Directory", "Contact", "Policy", "Privacy",
    }

    for el in soup.select("a, div"):
        name = el.get_text(strip=True)
        if not name:
            continue

        # Must contain a space (first + last name) and not be excessively long.
        parts = name.split()
        if len(parts) < 2 or len(parts) > 3:
            continue

        # Skip if any part contains non-letter chars (avoid & or ellipses).
        if any(not p.replace("-", "").isalpha() for p in parts):
            continue

        # Require that each word looks like a proper name (Title Case).
        if not all(p[0].isupper() and p[1:].islower() for p in parts):
            continue

        # Skip obvious nav / section words.
        if any(p in STOP_WORDS for p in parts):
            continue

        payload = {
            "slug": slugify(name),
            "name": name,
            "country": "USA",
            "flag": "🇺🇸",
            "strokes": None,
            "bio": None,
            "medals": None,
            "world_records": None,
            "world_rank": None,
        }
        athletes.append(payload)

    # Deduplicate by slug
    seen: set[str] = set()
    unique: list[dict] = []
    for a in athletes:
        if a["slug"] in seen:
            continue
        seen.add(a["slug"])
        unique.append(a)

    print(f"[{label}] Parsed {len(unique)} athletes from {url}")
    return unique


def main() -> None:
    sources = [
        ("worldaquatics_featured", scrape_worldaquatics_featured),
        ("usaswimming_spotlight", scrape_usaswimming_spotlight),
    ]

    for label, scraper in sources:
        try:
            athletes = scraper()
        except Exception as exc:  # noqa: BLE001
            print(f"[{label}] Scraper crashed: {exc}")
            continue

        for athlete in athletes:
            ingest(athlete, label)


if __name__ == "__main__":
    main()

