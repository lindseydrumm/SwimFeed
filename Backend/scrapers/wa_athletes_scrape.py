import requests
from tqdm import tqdm
from config import settings
from urllib.parse import quote

BASE = "https://api.worldaquatics.com/fina/athletes"
PHOTO_BASE = "https://api.worldaquatics.com/content/fina/photo/en/"
HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}


def fetch_page(page: int) -> dict:
    """Fetch a single page of athletes from the World Aquatics API."""
    params = {
        "pageSize": 100,
        "discipline": "SW",
        "page": page,
    }
    r = requests.get(BASE, params=params, headers=HEADERS, timeout=20)
    r.raise_for_status()
    return r.json()


def scrape_all() -> list[dict]:
    """Iterate through all pages and collect athlete entries."""
    page = 0
    athletes: list[dict] = []

    # First fetch a page to know how many total pages exist
    first_page = fetch_page(page)
    athletes.extend(first_page.get("content", []))
    page_info = first_page.get("pageInfo", {})
    total_pages = page_info.get("numPages", 1)

    # Progress bar for page navigation
    for page in tqdm(range(1, total_pages), desc="Fetching pages", unit="page"):
        data = fetch_page(page)
        athletes.extend(data.get("content", []))
    return athletes


def country_code_to_flag(code: str | None) -> str | None:
    """Convert a three‑letter IOC country code to a flag emoji.
    Only a subset of common codes is supported; unknown codes return None.
    """
    if not code:
        return None
    mapping = {
        "USA": "🇺🇸",
        "IND": "🇮🇳",
        "TUR": "🇹🇷",
        "EST": "🇪🇪",
        "DEN": "🇩🇰",
        "FIN": "🇫🇮",
    }
    return mapping.get(code.upper())


def fetch_photos(ids: list[int]) -> dict[int, str]:
    """Batch‑fetch photo URLs for a list of athlete IDs.
    Returns a mapping of athlete ID -> imageUrl (or empty dict if the request fails).
    """
    if not ids:
        return {}
    # Build referenceExpression like "FINA_ATHLETE:1307409" combined with OR
    # Use percent‑encoding ("%20") for spaces, matching the format that works in a browser.
    expr = " or ".join([f'"FINA_ATHLETE:{i}"' for i in ids])
    # Manually percent‑encode the expression to avoid '+' for spaces.
    encoded_expr = quote(expr, safe="")
    params = {
        "limit": 100,
        "tagNames": "athlete-image",
        "referenceExpression": encoded_expr,
    }
    try:
        r = requests.get(PHOTO_BASE, params=params, headers=HEADERS, timeout=20)
        # If the API returns a non‑200 status (e.g., 500), we treat it as no photos.
        if r.status_code != 200:
            tqdm.write(
                f"[photo] Warning: photo API returned {r.status_code}. Skipping photos for this batch."
            )
            return {}
        data = r.json()
    except Exception as exc:
        tqdm.write(f"[photo] Error fetching photos: {exc}. Continuing without photos.")
        return {}
    result: dict[int, str] = {}
    for item in data.get("content", []):
        # Each item may have multiple references; we look for the athlete reference
        for ref in item.get("references", []):
            if ref.get("type") == "FINA_ATHLETE":
                athlete_id = int(ref.get("id"))
                result[athlete_id] = item.get("imageUrl")
                break
    return result


def main():
    athletes = scrape_all()
    print(f"Fetched {len(athletes)} athletes from World Aquatics")

    # Filter out entries without a usable name
    athletes = [a for a in athletes if a.get("fullName", "").strip()]

    # Process in batches to limit photo API requests
    batch_size = 50  # Smaller batch to keep the photo‑API query length reasonable
    for i in tqdm(
        range(0, len(athletes), batch_size), desc="Processing batches", unit="batch"
    ):
        batch = athletes[i : i + batch_size]
        ids = [a["id"] for a in batch]
        # Fetch photos – if the request fails we fall back to an empty dict
        try:
            photo_map = fetch_photos(ids)
        except Exception as exc:  # safeguard – should never happen because fetch_photos has its own guard
            tqdm.write(
                f"[photo] Unexpected error: {exc}. Continuing without photos for this batch."
            )
            photo_map = {}
        for a in tqdm(batch, desc="Posting athletes", leave=False):
            payload = {
                "external_id": a["id"],
                "name": a["fullName"].strip(),
                "country": a.get("nationality"),
                "flag": country_code_to_flag(a.get("nationality")),
                "strokes": None,
                "bio": None,
                "medals": None,
                "world_records": None,
                "world_rank": None,
                "img": photo_map.get(a["id"]),
            }
            try:
                resp = requests.post(settings.athlete_api_url, json=payload, timeout=15)
                status = resp.status_code
            except Exception as exc:
                tqdm.write(
                    f"[ingest] Failed to POST athlete {payload.get('name')}: {exc}"
                )
                status = "error"
            print(f"  {payload['name']} ({payload.get('country')}) -> {status}")


if __name__ == "__main__":
    main()
