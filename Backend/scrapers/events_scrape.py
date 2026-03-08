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


if __name__ == "__main__":
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

        response = requests.post(settings.event_api_url, json=event)

        print(f"  {event['name']} ({event['city']}) -> {response.status_code}")
