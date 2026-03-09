import re
from typing import Optional

import requests
from lxml import html
from datetime import datetime

from config import settings

BASE = "https://www.usaswimming.org"

HEADERS = {"User-Agent": "Mozilla/5.0"}

URLS = [
    "https://www.usaswimming.org/events?Search=&EventType=National%20Meet&Month=All&CourseType=All&SortBy=Date",
    "https://www.usaswimming.org/events?Search=&EventType=International%20Meet&Month=All&CourseType=All&SortBy=Date",
]


def parse_dates(date_str: str) -> tuple[datetime, datetime]:
    """Parse a date range string into two naive ``datetime`` objects.

    Supported formats:
      - ``MM/DD/YYYY - MM/DD/YYYY`` (slash range)
      - ``MM/DD/YYYY``              (single slash date)
      - ``Apr 02-04, 2026``         (month-name range, dash or en-dash)
    """
    # Slash-separated range (e.g. "07/28/2026 - 08/01/2026")
    if "/" in date_str and "-" in date_str:
        try:
            start, end = [x.strip() for x in date_str.split("-")]
            return (
                datetime.strptime(start, "%m/%d/%Y"),
                datetime.strptime(end, "%m/%d/%Y"),
            )
        except ValueError:
            pass

    # Single slash date (e.g. "08/10/2026")
    if "/" in date_str and "-" not in date_str:
        try:
            single = datetime.strptime(date_str.strip(), "%m/%d/%Y")
            return single, single
        except ValueError:
            pass

    # Month-name range (e.g. "Apr 02-04, 2026" or with en-dash)
    m = re.search(
        r"([A-Za-z]{3,})\s+(\d{1,2})\s*[-\u2013]\s*(\d{1,2}),\s*(\d{4})",
        date_str,
    )
    if m:
        month_str, start_day, end_day, year = m.groups()
        return (
            datetime.strptime(f"{month_str} {start_day} {year}", "%b %d %Y"),
            datetime.strptime(f"{month_str} {end_day} {year}", "%b %d %Y"),
        )

    raise ValueError(f"Unrecognized date format: {date_str}")


def build_external_id(path: str) -> int:
    """Derive a stable external id from an event URL path.

    Example:
      /event/2026/07/28/default-calendar/toyota-national-championships
      -> 20260728
    """
    parts = path.strip("/").split("/")

    year, month, day = parts[1], parts[2], parts[3]
    return int(f"{year}{month}{day}")


def extract_path(onclick: str) -> Optional[str]:
    """Extract the URL path from an onclick attribute.

    Returns ``None`` when no path can be determined.
    """
    if not onclick:
        return None

    # Quoted path (single or double quotes)
    m = re.search(r"""['"](/[^'"]+)['"]""", onclick)
    if m:
        return m.group(1)

    # Plain path starting with /
    if onclick.startswith("/"):
        return onclick.split(";")[0].strip()

    # Function call with quoted argument, e.g. goToEvent('/event/...')
    m = re.search(r"""\(['"](/[^'"]+)['"]\)""", onclick)
    if m:
        return m.group(1)

    return None


def scrape_events() -> list[dict]:
    events: list[dict] = []

    for url in URLS:
        res = requests.get(url, timeout=20, headers=HEADERS)
        res.raise_for_status()

        tree = html.fromstring(res.content)
        rows = tree.cssselect("tr.usas-content-eventsearch-event")

        for row in rows:
            cols = row.cssselect("td")
            if len(cols) < 5:
                continue

            values = [c.text_content().strip() for c in cols]

            onclick = cols[0].attrib.get("onclick", "")
            path = extract_path(onclick)
            if not path:
                continue

            date_from, date_to = parse_dates(values[2])

            events.append(
                {
                    "external_id": build_external_id(path),
                    "name": values[0],
                    "date_from": date_from.isoformat(),
                    "date_to": date_to.isoformat(),
                    "city": values[4] or None,
                    "country": "United States",
                    "country_code": "US",
                    "competition_type": values[1],
                    "disciplines": values[3],
                }
            )

    return events


def main():
    events = scrape_events()
    print(f"Scraped {len(events)} events from USA Swimming")

    for event in events:
        response = requests.post(settings.event_api_url, json=event)
        print(f"  {event['name']} ({event['city']}) -> {response.status_code}")


if __name__ == "__main__":
    main()
