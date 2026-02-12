# scrape.py
#   gets article data from web sources

import feedparser
import requests
from datetime import datetime

# import environmental vars
from config import settings

FEED_URL = "https://swimswam.com/feed/"

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

    response = requests.post(settings.api_url, json=article)

    print(article["title"], response.status_code)
