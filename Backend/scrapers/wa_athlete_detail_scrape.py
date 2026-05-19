"""Scrape athlete detail pages from World Aquatics.

Parses the server-rendered HTML for:
  - Medal counts (gold/silver/bronze) from the header bar charts
  - Personal best results table
  - Profile tab (DOB, height, coach, club) — fetched from WA API

Usage:
  docker exec swimlive_backend uv run -m scrapers.wa_athlete_detail_scrape
"""

import time
from datetime import datetime, timedelta, timezone
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm
from config import settings


WA_ATHLETE_URL = "https://www.worldaquatics.com/athletes/{ext_id}/{slug}"
WA_API_ATHLETE_URL = "https://api.worldaquatics.com/fina/athletes/{ext_id}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
API_HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}

# Rate limit: seconds between HTML page requests
REQUEST_DELAY = 1.0

# Re-scrape an athlete's detail page only if last scrape is older than this.
SCRAPE_TTL_DAYS = 3


# ---------------------------------------------------------------------------
# HTML Parsing
# ---------------------------------------------------------------------------


def parse_medal_counts(soup: BeautifulSoup) -> dict:
    """Extract gold/silver/bronze medal counts from the header bar charts."""
    medals = {"gold_medals": 0, "silver_medals": 0, "bronze_medals": 0}
    key_map = {"gold": "gold_medals", "silver": "silver_medals", "bronze": "bronze_medals"}

    for wrapper in soup.select(".athlete-header__bar-chart-wrapper"):
        # The bar chart div has data-value attribute with the count
        bar = wrapper.select_one("[data-value]")
        medal_type_el = wrapper.select_one(".athlete-header__medal-type")
        if bar and medal_type_el:
            medal_type = medal_type_el.get_text(strip=True).lower()
            key = key_map.get(medal_type)
            if key:
                try:
                    medals[key] = int(bar["data-value"])
                except (ValueError, KeyError):
                    pass
    return medals


def parse_personal_bests(soup: BeautifulSoup) -> list[dict]:
    """Extract personal best results from the results table."""
    results = []
    table = soup.select_one(".athlete-table--best-results")
    if not table:
        return results

    for row in table.select("tbody tr.athlete-table__row"):
        cells = row.select("td.athlete-table__cell")
        if len(cells) < 7:
            continue

        # Extract event name
        event_el = row.select_one(".athlete-table__cell--event")
        event = event_el.get_text(strip=True) if event_el else ""

        # Extract time
        time_el = row.select_one(".athlete-table__cell--time")
        time_val = ""
        if time_el:
            strong = time_el.select_one("strong")
            time_val = strong.get_text(strip=True) if strong else time_el.get_text(strip=True)

        # Extract medal (gold/silver/bronze or None)
        medal = None
        medal_cell = cells[2] if len(cells) > 2 else None
        if medal_cell:
            sr = medal_cell.select_one(".u-screen-reader")
            if sr:
                medal = sr.get_text(strip=True).lower()
            else:
                # Check for medal SVG class
                for medal_type in ("gold", "silver", "bronze"):
                    if medal_cell.select_one(f".athlete-table__medal--{medal_type}"):
                        medal = medal_type
                        break

        # Pool length (may not exist for all pages)
        pool_length = None
        pool_cells = [c for c in cells if "athlete-table__cell--pool-length" in " ".join(c.get("class", []))]
        if pool_cells:
            pool_length = pool_cells[0].get_text(strip=True)
        else:
            # Fall back to positional: pool length is typically cell index 3
            if len(cells) > 3:
                pool_text = cells[3].get_text(strip=True)
                if pool_text in ("25m", "50m"):
                    pool_length = pool_text

        # Age
        age = None
        age_cells = [c for c in cells if "u-text-center" in " ".join(c.get("class", []))]
        # Age is typically the cell after pool length, before competition
        for c in cells:
            text = c.get_text(strip=True)
            if text.isdigit() and 10 <= int(text) <= 50:
                age = int(text)
                break

        # Competition name
        comp = ""
        # Competition is typically a cell without u-text-center that isn't the event cell
        for c in cells:
            classes = " ".join(c.get("class", []))
            text = c.get_text(strip=True)
            if ("u-text-center" not in classes
                    and "athlete-table__cell--event" not in classes
                    and len(text) > 10):
                comp = text
                break

        # Competition country
        comp_country = ""
        comp_country_cell = row.select_one(".athlete-table__cell--comp-country")
        if comp_country_cell:
            # Extract the country code text (ignoring flag images)
            flag_img = comp_country_cell.select_one("img.flag__img")
            if flag_img:
                comp_country = flag_img.get("alt", "").strip()
            if not comp_country:
                comp_country = comp_country_cell.get_text(strip=True)

        # Date
        result_date = ""
        date_cell = cells[-1] if cells else None
        if date_cell:
            result_date = date_cell.get_text(strip=True)

        if event and time_val:
            results.append({
                "event": event,
                "time": time_val,
                "medal": medal,
                "pool_length": pool_length,
                "age": age,
                "competition": comp,
                "comp_country": comp_country,
                "result_date": result_date,
            })

    return results


def parse_discipline(soup: BeautifulSoup) -> str | None:
    """Extract discipline from header (e.g. 'Swimming')."""
    el = soup.select_one(".athlete-header__athlete-discipline--name")
    return el.get_text(strip=True) if el else None


def scrape_athlete_page(external_id: int, slug: str) -> dict | None:
    """Fetch and parse a single athlete detail page.

    Returns a dict with medal counts, personal bests, discipline, or None on failure.
    """
    # Build URL — WA uses the format /athletes/{id}/{slug}
    url = WA_ATHLETE_URL.format(ext_id=external_id, slug=slug)
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        if r.status_code != 200:
            tqdm.write(f"[detail] {slug} -> HTTP {r.status_code}")
            return None
    except Exception as exc:
        tqdm.write(f"[detail] {slug} -> error: {exc}")
        return None

    soup = BeautifulSoup(r.text, "lxml")
    medals = parse_medal_counts(soup)
    personal_bests = parse_personal_bests(soup)
    discipline = parse_discipline(soup)

    return {
        **medals,
        "discipline": discipline,
        "personal_bests": personal_bests,
    }


def fetch_athlete_profile_api(external_id: int) -> dict:
    """Fetch extra profile fields from the WA API (DOB, gender already stored, but also check for extras)."""
    # The main WA API endpoint already returns dateOfBirth and gender,
    # which are now captured by the regular athlete scraper.
    # This function is here as a hook for future profile tab data
    # (height, coach, club) if WA exposes an endpoint for them.
    return {}


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------


def _post_athlete_detail(external_id: int, detail: dict) -> None:
    """POST scraped detail data to the backend ingest endpoint."""
    ingest_headers = {"Content-Type": "application/json"}
    if settings.ingest_api_key:
        ingest_headers["X-API-Key"] = settings.ingest_api_key

    payload = {
        "external_id": external_id,
        "gold_medals": detail.get("gold_medals"),
        "silver_medals": detail.get("silver_medals"),
        "bronze_medals": detail.get("bronze_medals"),
        "discipline": detail.get("discipline"),
    }

    try:
        resp = requests.post(
            settings.athlete_detail_api_url,
            json=payload,
            headers=ingest_headers,
            timeout=15,
        )
        if resp.status_code not in (200, 201):
            tqdm.write(f"[ingest-detail] ext_id={external_id} -> {resp.status_code}: {resp.text[:200]}")
    except Exception as exc:
        tqdm.write(f"[ingest-detail] ext_id={external_id} -> error: {exc}")


def _post_personal_bests(external_id: int, personal_bests: list[dict]) -> None:
    """POST personal bests to the backend ingest endpoint."""
    if not personal_bests:
        return

    ingest_headers = {"Content-Type": "application/json"}
    if settings.ingest_api_key:
        ingest_headers["X-API-Key"] = settings.ingest_api_key

    payload = {
        "external_id": external_id,
        "personal_bests": personal_bests,
    }

    try:
        resp = requests.post(
            settings.athlete_personal_bests_api_url,
            json=payload,
            headers=ingest_headers,
            timeout=15,
        )
        if resp.status_code not in (200, 201):
            tqdm.write(f"[ingest-pbs] ext_id={external_id} -> {resp.status_code}: {resp.text[:200]}")
    except Exception as exc:
        tqdm.write(f"[ingest-pbs] ext_id={external_id} -> error: {exc}")


# ---------------------------------------------------------------------------
# Scrape a single athlete (used by on-demand endpoint)
# ---------------------------------------------------------------------------


def scrape_single(external_id: int, slug: str) -> dict | None:
    """Scrape one athlete's detail page and return parsed data (no ingestion)."""
    return scrape_athlete_page(external_id, slug)


# ---------------------------------------------------------------------------
# Batch scrape (run from run_all.py or CLI)
# ---------------------------------------------------------------------------


def main(athlete_ids: set[int] | None = None):
    """Scrape detail pages for athletes in the DB.

    If *athlete_ids* is provided, only those are scraped.
    Otherwise, scrapes athletes that appear in rankings (those with detail_scraped_at IS NULL first).
    """
    from scrapers import print_ingest_info

    print_ingest_info(settings.athlete_detail_api_url)

    # Fetch athletes from DB that need detail scraping
    import requests as req

    # Get athletes to scrape — use the backend API
    base = settings.athlete_api_url.rsplit("/ingest/athlete", 1)[0]

    # Fetch all athletes, prioritising those without detail data
    try:
        resp = req.get(f"{base}/athletes", params={"limit": 100, "offset": 0}, timeout=15)
        data = resp.json()
        total = data.get("total", 0)
        athletes = data.get("athletes", [])

        # Fetch remaining pages
        offset = 100
        while offset < total:
            resp = req.get(f"{base}/athletes", params={"limit": 100, "offset": offset}, timeout=15)
            page = resp.json()
            athletes.extend(page.get("athletes", []))
            offset += 100
    except Exception as exc:
        print(f"Failed to fetch athletes from API: {exc}")
        return

    # Filter to requested IDs if specified
    if athlete_ids:
        athletes = [a for a in athletes if a["external_id"] in athlete_ids]

    # Skip athletes whose detail was scraped within SCRAPE_TTL_DAYS.
    threshold = datetime.now(timezone.utc) - timedelta(days=SCRAPE_TTL_DAYS)

    def _needs_scrape(a: dict) -> bool:
        ts = a.get("detail_scraped_at")
        if not ts:
            return True
        try:
            scraped_at = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if scraped_at.tzinfo is None:
                scraped_at = scraped_at.replace(tzinfo=timezone.utc)
            return scraped_at < threshold
        except (ValueError, AttributeError):
            return True

    to_scrape = [a for a in athletes if _needs_scrape(a)]
    skipped = len(athletes) - len(to_scrape)

    # Prioritise never-scraped athletes first
    to_scrape.sort(key=lambda a: (a.get("detail_scraped_at") is not None, a.get("detail_scraped_at") or ""))

    print(
        f"{len(to_scrape)} athletes to scrape, {skipped} already fresh (within {SCRAPE_TTL_DAYS} days, skipped)"
    )

    if not to_scrape:
        print("Nothing to do.")
        return

    success = 0
    for athlete in tqdm(to_scrape, desc="Scraping athlete details", unit="athlete"):
        ext_id = athlete["external_id"]
        slug = athlete["slug"]

        detail = scrape_athlete_page(ext_id, slug)
        if detail:
            _post_athlete_detail(ext_id, detail)
            _post_personal_bests(ext_id, detail.get("personal_bests", []))
            success += 1

        time.sleep(REQUEST_DELAY)

    print(f"Successfully scraped {success}/{len(to_scrape)} athlete detail pages")


if __name__ == "__main__":
    main()
