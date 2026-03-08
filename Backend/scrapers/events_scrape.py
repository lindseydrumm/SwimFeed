import requests
from pprint import pprint
from datetime import datetime

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

    data = fetch_page(page, start, end)
    pprint(data)

    events.extend(data["content"])

    return events


if __name__ == "__main__":
    events = scrape_all("2026-01-01T00:00:00+00:00", "2027-01-01T00:00:00+00:00")

    for e in events:
        print(e["name"], e["venueDateFrom"])
