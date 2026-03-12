"""
scrape_athletes.py

Seed the athletes table by gathering swimmer metadata from multiple sources
and POSTing to the FastAPI backend at /ingest/athlete.

This script now performs real HTTP requests to remote sites and attempts to
parse athlete information. If a given source fails (layout change, network
error), it is skipped so the rest of the pipeline still works.
"""

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from config import settings


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
    headers = {}
    if settings.ingest_api_key:
        headers["X-API-Key"] = settings.ingest_api_key
    resp = requests.post(
        settings.athlete_api_url, json=payload, headers=headers, timeout=15
    )

    if resp.status_code == 401:
        print(
            f"  -> 401 Unauthorized: API key is missing or incorrect. "
            "Check that INGEST_API_KEY in your .env matches the server."
        )
    elif resp.status_code == 422:
        print(f"  -> 422 Validation Error: {resp.text[:200]}")
    else:
        print(f"  -> {resp.status_code} {resp.text[:120]}")


def scrape_worldaquatics_featured() -> list[dict]:
    """
    Scrape a featured athletes list from World Aquatics.

    This targets a generic pattern of athlete cards linking to /athletes/.
    The exact selectors may need adjustment over time, but the code is
    defensive: if nothing matches, it simply returns an empty list.
    """
    url = "https://www.worldaquatics.com/athletes"
    label = "worldaquatics_featured"
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
    except Exception as exc:  # noqa: BLE001
        print(f"[{label}] Failed to fetch {url}: {exc}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    athletes: list[dict] = []

    # Heuristic: links that look like athlete profiles.
    for link in soup.select("a[href*='/athletes/']")[:20]:
        name = link.get_text(strip=True)
        if not name:
            continue

        country = None
        country_el = link.find_next("span")
        if country_el:
            text = country_el.get_text(strip=True)
            if text and len(text) <= 3:
                country = text

        payload = {
            "slug": slugify(name),
            "name": name,
            "country": country,
            "flag": None,
            "strokes": None,
            "bio": None,
            "medals": None,
            "world_records": None,
            "world_rank": None,
        }
        athletes.append(payload)

    print(f"[{label}] Parsed {len(athletes)} athletes from {url}")
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
        "Home",
        "Events",
        "Tickets",
        "Shop",
        "Resources",
        "Parents",
        "Times",
        "Standards",
        "Records",
        "Results",
        "Information",
        "Coaches",
        "Officials",
        "Summit",
        "Governance",
        "Services",
        "Programs",
        "Team",
        "Club",
        "Database",
        "Archive",
        "Recognition",
        "Incentive",
        "Login",
        "Register",
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
    from scrapers import print_ingest_info

    print_ingest_info(settings.athlete_api_url)

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
