# scrape.py
# gets article data from multiple web sources

import sys
import feedparser
import requests
from datetime import datetime
from tqdm import tqdm

# import environmental vars
from config import settings


SOURCES = [
    {
        "source": "swimswam",
        "feed_url": "https://swimswam.com/feed/",
    },
    {
        "source": "swimmingworld",
        "feed_url": "https://www.swimmingworldmagazine.com/news/feed/",
    },
    {
        "source": "bbc",
        "feed_url": "https://feeds.bbci.co.uk/sport/swimming/rss.xml",
    },
]


def main():
    for s in tqdm(SOURCES, desc="Fetching sources", unit="Source"):
        feed = feedparser.parse(s["feed_url"])

        for entry in feed.entries:
            article = {
                "title": entry.title,
                "url": entry.link,
                "published_at": (
                    datetime(*entry.published_parsed[:6]).isoformat()
                    if hasattr(entry, "published_parsed")
                    else None
                ),
                "summary": entry.summary if hasattr(entry, "summary") else None,
                "source": s["source"],
            }

            headers = {}
            if settings.ingest_api_key:
                headers["X-API-Key"] = settings.ingest_api_key
            response = requests.post(
                settings.article_api_url, json=article, headers=headers
            )

            if response.status_code == 401:
                print(
                    f"[{s['source']}] {article['title']} -> 401 Unauthorized: "
                    "API key is missing or incorrect. "
                    "Check that INGEST_API_KEY in your .env matches the server."
                )
            elif response.status_code == 422:
                print(
                    f"[{s['source']}] {article['title']} -> 422 Validation Error: "
                    f"{response.text[:200]}"
                )
            else:
                print(f"[{s['source']}] {article['title']} -> {response.status_code}")


if __name__ == "__main__":
    main()
