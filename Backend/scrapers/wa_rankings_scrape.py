# wa_rankings_scrape.py
# Fetches World Aquatics all-time and current-year swimming rankings.
# For each event (gender × stroke × distance × pool), fetches the top 10
# unique athletes and ingests them as rankings.  Rank-1 entries are also
# ingested as world/current records.
#
# Returns the set of unique athlete external_ids found across all rankings
# so downstream scrapers can fetch only those athletes + photos.

import datetime
import requests
from tqdm import tqdm
from config import settings

RANKINGS_BASE = "https://api.worldaquatics.com/fina/rankings/swimming"
HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}

# ── Event matrix ──────────────────────────────────────────────────────
STROKES = {
    "FREESTYLE": [50, 100, 200, 400, 800, 1500],
    "BACKSTROKE": [50, 100, 200],
    "BREASTSTROKE": [50, 100, 200],
    "BUTTERFLY": [50, 100, 200],
    "MEDLEY": [200, 400],
}
GENDERS = ["M", "F"]
POOLS = ["LCM", "SCM"]
TOP_N = 10  # unique athletes per event


def _build_event_combos() -> list[dict]:
    """Return every (gender, stroke, distance, pool) combination."""
    combos = []
    for gender in GENDERS:
        for stroke, distances in STROKES.items():
            for distance in distances:
                for pool in POOLS:
                    combos.append(
                        {
                            "gender": gender,
                            "stroke": stroke,
                            "distance": distance,
                            "pool": pool,
                        }
                    )
    return combos


def fetch_rankings(
    gender: str,
    distance: int,
    stroke: str,
    pool: str,
    year: int | None = None,
) -> list[dict]:
    """Fetch ranking results for one event discipline.

    Returns up to 200 raw result entries from the API.
    """
    params: dict = {
        "gender": gender,
        "distance": distance,
        "stroke": stroke,
        "poolConfiguration": pool,
        "timesMode": "ALL_TIMES",
        "pageSize": 200,
    }
    if year:
        params["year"] = year

    try:
        r = requests.get(RANKINGS_BASE, params=params, headers=HEADERS, timeout=30)
        if r.status_code != 200:
            tqdm.write(
                f"[rankings] Warning: {gender} {distance}m {stroke} {pool}"
                f" returned {r.status_code}. Skipping."
            )
            return []
        return r.json().get("swimmingWorldRankings", [])
    except Exception as exc:
        tqdm.write(f"[rankings] Error fetching {gender} {distance}m {stroke} {pool}: {exc}")
        return []


def extract_top_unique(results: list[dict], top_n: int = TOP_N) -> list[dict]:
    """Deduplicate by personId and return the top N unique athletes.

    Each athlete keeps only their highest-ranked (first appearing) result.
    """
    seen: set[str] = set()
    unique: list[dict] = []
    for r in results:
        pid = r.get("personId")
        if pid and pid not in seen:
            seen.add(pid)
            unique.append(r)
            if len(unique) >= top_n:
                break
    return unique


def result_to_ext_id(result: dict) -> int | None:
    """Extract the integer athlete external_id from resultId like 'R1000604'."""
    rid = result.get("resultId", "")
    if rid.startswith("R"):
        try:
            return int(rid[1:])
        except ValueError:
            pass
    return None


def _post(url: str, payload: dict) -> None:
    """POST a payload to an ingest endpoint."""
    headers = {}
    if settings.ingest_api_key:
        headers["X-API-Key"] = settings.ingest_api_key
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        if resp.status_code == 401:
            tqdm.write(f"[ingest] 401 Unauthorized posting to {url}")
        elif resp.status_code == 422:
            tqdm.write(f"[ingest] 422: {resp.text[:200]}")
    except Exception as exc:
        tqdm.write(f"[ingest] POST failed: {exc}")


def scrape_rankings(ranking_type: str = "alltime", year: int | None = None) -> set[int]:
    """Scrape rankings for all events and return the set of unique athlete external_ids.

    ranking_type: 'alltime' or 'current' — stored in the DB to distinguish passes.
    year: if set, passed to the API to get only results from that year.
    """
    combos = _build_event_combos()
    all_athlete_ids: set[int] = set()

    label = f"Rankings ({ranking_type})"
    for combo in tqdm(combos, desc=label, unit="event"):
        results = fetch_rankings(
            gender=combo["gender"],
            distance=combo["distance"],
            stroke=combo["stroke"],
            pool=combo["pool"],
            year=year,
        )
        top = extract_top_unique(results)

        for i, r in enumerate(top):
            ext_id = result_to_ext_id(r)
            if ext_id is None:
                continue
            all_athlete_ids.add(ext_id)

            ranking_payload = {
                "athlete_ext_id": ext_id,
                "athlete_name": r.get("fullName", "").strip(),
                "country_code": r.get("participantCountryCode"),
                "gender": combo["gender"],
                "distance": combo["distance"],
                "stroke": combo["stroke"],
                "pool": combo["pool"],
                "rank": i + 1,
                "time": r.get("time", ""),
                "fina_points": r.get("finaPoints"),
                "event_name": r.get("eventName"),
                "event_city": r.get("eventCity"),
                "result_date": r.get("resultDate"),
                "ranking_type": ranking_type,
            }
            _post(settings.ranking_api_url, ranking_payload)

            # Rank 1 → also ingest as a record (only for alltime)
            if i == 0 and ranking_type == "alltime":
                record_payload = {
                    "athlete_ext_id": ext_id,
                    "athlete_name": r.get("fullName", "").strip(),
                    "country_code": r.get("participantCountryCode"),
                    "gender": combo["gender"],
                    "distance": combo["distance"],
                    "stroke": combo["stroke"],
                    "pool": combo["pool"],
                    "time": r.get("time", ""),
                    "fina_points": r.get("finaPoints"),
                    "event_name": r.get("eventName"),
                    "event_city": r.get("eventCity"),
                    "result_date": r.get("resultDate"),
                }
                _post(settings.record_api_url, record_payload)

    return all_athlete_ids


def main() -> set[int]:
    from scrapers import print_ingest_info

    print_ingest_info(settings.ranking_api_url)

    # Pass 1: all-time rankings + records
    print("--- All-time rankings ---")
    alltime_ids = scrape_rankings(ranking_type="alltime")
    print(f"All-time: {len(alltime_ids)} unique athletes across all events")

    # Pass 2: current-year rankings
    current_year = datetime.date.today().year
    print(f"\n--- {current_year} rankings ---")
    current_ids = scrape_rankings(ranking_type="current", year=current_year)
    print(f"Current year: {len(current_ids)} unique athletes across all events")

    combined = alltime_ids | current_ids
    print(f"\nTotal unique athletes to seed: {len(combined)}")
    return combined


if __name__ == "__main__":
    main()
