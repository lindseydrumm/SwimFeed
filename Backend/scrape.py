# scrape.py
#   gets article data from web sources

import feedparser
import requests
from datetime import datetime

FEED_URL = "https://swimswam.com/feed/"
API_URL = "http://127.0.0.1:8000/ingest/article"

feed = feedparser.parse(FEED_URL)

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
        "source": "swimswam",
    }

    response = requests.post(API_URL, json=article)

    print(article["title"], response.status_code)
