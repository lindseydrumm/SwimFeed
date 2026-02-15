# scrape.py
# gets article data from multiple web sources

import feedparser
import requests
from datetime import datetime

API_URL = "http://127.0.0.1:8000/ingest/article"


SOURCES = [
    {
        "source": "swimswam",
        "feed_url": "https://swimswam.com/feed/",
    },
    {
        "source": "worldaquatics",
        "feed_url": "https://www.worldaquatics.com/news/rss",
    },
    {
        "source": "usaswimming",
        "feed_url": "https://www.usaswimming.org/news/rss",
    },
    {
        "source": "swimmingworld",
        "feed_url": "https://www.swimmingworldmagazine.com/news/feed/",
    },
]

for s in SOURCES:
    print(f"Fetching from {s['source']}...")

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

        response = requests.post(API_URL, json=article)

        print(f"[{s['source']}] {article['title']} -> {response.status_code}")
