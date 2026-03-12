import requests
from datetime import datetime

from config import settings

BASE = "https://api.worldaquatics.com/fina/competitions"

HEADERS = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}


def fetch_page(page, start, end):
    params = {
        "pageSize": 100,
        "venueDateFrom": start,
        "venueDateTo": end,
        "disciplines": "SW",
        "group": "FINA",
        "sort": "dateFrom,asc",
        "page": page,
    }

    r = requests.get(BASE, params=params, headers=HEADERS, timeout=20)
    r.raise_for_status()
    return r.json()


def scrape_all(start, end):
    page = 0
    events = []

    while True:
        data = fetch_page(page, start, end)
        events.extend(data["content"])

        page_info = data["pageInfo"]
        if page + 1 >= page_info["numPages"]:
            break
        page += 1

    return events


def main():
    from scrapers import print_ingest_info

    print_ingest_info(settings.event_api_url)

    events = scrape_all("2026-01-01T00:00:00+00:00", "2027-01-01T00:00:00+00:00")

    print(f"Fetched {len(events)} events from World Aquatics")

    for e in events:
        event = {
            "external_id": e["id"],
            "name": e["name"],
            "date_from": e.get("dateFrom"),
            "date_to": e.get("dateTo"),
            "city": e.get("location", {}).get("city"),
            "country": e.get("location", {}).get("countryName"),
            "country_code": e.get("location", {}).get("countryCode"),
            "competition_type": e.get("competitionType", {}).get("name"),
            "disciplines": ",".join(e.get("disciplines", [])),
        }

        ingest_headers = {}
        if settings.ingest_api_key:
            ingest_headers["X-API-Key"] = settings.ingest_api_key
        response = requests.post(
            settings.event_api_url, json=event, headers=ingest_headers
        )

        if response.status_code == 401:
            print(
                f"  {event['name']} ({event['city']}) -> 401 Unauthorized: "
                "API key is missing or incorrect. "
                "Check that INGEST_API_KEY in your .env matches the server."
            )
        elif response.status_code == 422:
            print(
                f"  {event['name']} ({event['city']}) -> 422 Validation Error: "
                f"{response.text[:200]}"
            )
        else:
            print(f"  {event['name']} ({event['city']}) -> {response.status_code}")


if __name__ == "__main__":
    main()
