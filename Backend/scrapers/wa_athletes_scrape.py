import requests
from tqdm import tqdm
from config import settings
from scrapers import normalize_name


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


def fetch_athlete_by_id(athlete_id: int) -> dict | None:
    """Fetch a single athlete by their external ID."""
    try:
        r = requests.get(f"{BASE}/{athlete_id}", headers=HEADERS, timeout=20)
        if r.status_code != 200:
            return None
        return r.json()
    except Exception:
        return None


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


def scrape_by_ids(ids: set[int]) -> list[dict]:
    """Fetch athletes individually by their external IDs."""
    athletes: list[dict] = []
    for aid in tqdm(sorted(ids), desc="Fetching athletes by ID", unit="athlete"):
        data = fetch_athlete_by_id(aid)
        if data and data.get("fullName", "").strip():
            athletes.append(data)
    return athletes


def country_code_to_flag(code: str | None) -> str | None:
    """Convert a three-letter IOC country code to a flag emoji.

    Uses an IOC→ISO-3166-1-alpha-2 mapping for codes that differ,
    then converts the 2-letter code to regional-indicator emoji algorithmically.
    """
    if not code:
        return None

    # IOC codes that differ from ISO alpha-2 (or alpha-3 truncation).
    # Most IOC 3-letter codes match the first two letters of ISO alpha-2,
    # but ~40 countries diverge. This covers all swimming-relevant ones.
    IOC_TO_ISO2 = {
        "AHO": "CW", "ALG": "DZ", "ANG": "AO", "ANT": "AG", "ARU": "AW",
        "BAH": "BS", "BAN": "BD", "BAR": "BB", "BER": "BM", "BIZ": "BZ",
        "BOT": "BW", "BRU": "BN", "BUL": "BG", "BUR": "BF", "CAM": "KH",
        "CAY": "KY", "CGO": "CG", "CHI": "CL", "CHN": "CN", "CIV": "CI",
        "COD": "CD", "CRC": "CR", "CRO": "HR", "DEN": "DK", "ESA": "SV",
        "ESP": "ES", "FIJ": "FJ", "GBR": "GB", "GER": "DE", "GRE": "GR",
        "GUA": "GT", "GUI": "GN", "HAI": "HT", "HKG": "HK", "HON": "HN",
        "INA": "ID", "IND": "IN", "IRI": "IR", "IRL": "IE", "ISV": "VI",
        "ITA": "IT", "IVB": "VG", "JAM": "JM", "JPN": "JP", "KAZ": "KZ",
        "KGZ": "KG", "KOR": "KR", "KSA": "SA", "KUW": "KW", "LAT": "LV",
        "LBA": "LY", "LES": "LS", "LIB": "LB", "LTU": "LT", "MAD": "MG",
        "MAS": "MY", "MAW": "MW", "MEX": "MX", "MGL": "MN", "MKD": "MK",
        "MLI": "ML", "MNE": "ME", "MON": "MC", "MOZ": "MZ", "MRI": "MU",
        "MTN": "MR", "MYA": "MM", "NAM": "NA", "NCA": "NI", "NED": "NL",
        "NEP": "NP", "NGR": "NG", "NIG": "NE", "NOR": "NO", "OMA": "OM",
        "PAK": "PK", "PAN": "PA", "PAR": "PY", "PER": "PE", "PHI": "PH",
        "PLE": "PS", "PNG": "PG", "POR": "PT", "PRK": "KP", "PUR": "PR",
        "QAT": "QA", "ROU": "RO", "RSA": "ZA", "RUS": "RU", "RWA": "RW",
        "SAM": "WS", "SEN": "SN", "SEY": "SC", "SIN": "SG", "SLE": "SL",
        "SLO": "SI", "SMR": "SM", "SOL": "SB", "SOM": "SO", "SRB": "RS",
        "SRI": "LK", "SUD": "SD", "SUI": "CH", "SUR": "SR", "SVK": "SK",
        "SWE": "SE", "SWZ": "SZ", "SYR": "SY", "TAN": "TZ", "TGA": "TO",
        "THA": "TH", "TJK": "TJ", "TKM": "TM", "TOG": "TG", "TPE": "TW",
        "TRI": "TT", "TUN": "TN", "TUR": "TR", "UAE": "AE", "UGA": "UG",
        "UKR": "UA", "URU": "UY", "USA": "US", "UZB": "UZ", "VAN": "VU",
        "VEN": "VE", "VIE": "VN", "ZAM": "ZM", "ZIM": "ZW",
        # Common aliases
        "EST": "EE", "FIN": "FI", "AUS": "AU", "AUT": "AT", "BRA": "BR",
        "CAN": "CA", "COL": "CO", "CUB": "CU", "CZE": "CZ", "ECU": "EC",
        "EGY": "EG", "ETH": "ET", "FRA": "FR", "GEO": "GE", "GHA": "GH",
        "HUN": "HU", "ISL": "IS", "ISR": "IL", "KEN": "KE", "NZL": "NZ",
        "POL": "PL", "SGP": "SG",
    }

    ioc = code.upper()
    iso2 = IOC_TO_ISO2.get(ioc)
    if not iso2:
        # Fallback: try first two letters (works for ~100 codes like ARG, BEL, etc.)
        iso2 = ioc[:2]

    # Convert 2-letter ISO code to regional indicator symbols (flag emoji)
    try:
        return "".join(chr(0x1F1E6 + ord(c) - ord("A")) for c in iso2.upper())
    except Exception:
        return None


def fetch_photos(ids: list[int]) -> dict[int, str]:
    """Batch-fetch photo URLs for a list of athlete IDs.
    Returns a mapping of athlete ID -> imageUrl (or empty dict if the request fails).
    """
    if not ids:
        return {}
    expr = " or ".join([f'"FINA_ATHLETE:{i}"' for i in ids])
    params = {
        "limit": 100,
        "tagNames": "athlete-image",
        "referenceExpression": expr,
    }
    try:
        r = requests.get(PHOTO_BASE, params=params, headers=HEADERS, timeout=20)
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
        for ref in item.get("references", []):
            if ref.get("type") == "FINA_ATHLETE":
                athlete_id = int(ref.get("id"))
                result[athlete_id] = item.get("imageUrl")
                break
    return result


def _post_athlete(payload: dict) -> None:
    """POST a single athlete payload to the ingest endpoint."""
    ingest_headers = {}
    if settings.ingest_api_key:
        ingest_headers["X-API-Key"] = settings.ingest_api_key
    try:
        resp = requests.post(
            settings.athlete_api_url,
            json=payload,
            headers=ingest_headers,
            timeout=15,
        )
    except Exception as exc:
        tqdm.write(f"[ingest] Failed to POST athlete {payload.get('name')}: {exc}")
        return

    if resp.status_code == 401:
        tqdm.write(
            f"[ingest] {payload['name']} -> 401 Unauthorized: "
            "API key is missing or incorrect. "
            "Check that INGEST_API_KEY in your .env matches the server."
        )
    elif resp.status_code == 422:
        tqdm.write(
            f"[ingest] {payload['name']} -> 422 Validation Error: "
            f"{resp.text[:200]}"
        )
    else:
        print(f"  {payload['name']} ({payload.get('country')}) -> {resp.status_code}")


def _ingest_athletes(athletes: list[dict]) -> None:
    """Batch-fetch photos and ingest a list of athlete dicts."""
    batch_size = 50
    for i in tqdm(
        range(0, len(athletes), batch_size), desc="Processing batches", unit="batch"
    ):
        batch = athletes[i : i + batch_size]
        ids = [a["id"] for a in batch]
        try:
            photo_map = fetch_photos(ids)
        except Exception as exc:
            tqdm.write(
                f"[photo] Unexpected error: {exc}. Continuing without photos for this batch."
            )
            photo_map = {}
        for a in tqdm(batch, desc="Posting athletes", leave=False):
            payload = {
                "external_id": a["id"],
                "name": normalize_name(a["fullName"].strip()),
                "country": a.get("nationality"),
                "flag": country_code_to_flag(a.get("nationality")),
                "strokes": None,
                "bio": None,
                "medals": None,
                "world_records": None,
                "world_rank": None,
                "img": photo_map.get(a["id"]),
                "gender": a.get("gender"),
                "date_of_birth": a.get("dateOfBirth"),
            }
            _post_athlete(payload)


def main(athlete_ids: set[int] | None = None):
    """Scrape and ingest athletes.

    If *athlete_ids* is provided, only those athletes are fetched (targeted mode).
    Otherwise all athletes are fetched via full pagination (legacy mode).
    """
    from scrapers import print_ingest_info

    print_ingest_info(settings.athlete_api_url)

    if athlete_ids:
        print(f"Targeted mode: fetching {len(athlete_ids)} athletes by ID")
        athletes = scrape_by_ids(athlete_ids)
    else:
        athletes = scrape_all()

    print(f"Fetched {len(athletes)} athletes from World Aquatics")

    # Filter out entries without a usable name
    athletes = [a for a in athletes if a.get("fullName", "").strip()]

    _ingest_athletes(athletes)


if __name__ == "__main__":
    main()
