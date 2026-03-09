# scrape.py
# gets article data from multiple web sources

import sys
import feedparser
import requests
from datetime import datetime

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

            response = requests.post(settings.api_url, json=article)

            print(f"[{s['source']}] {article['title']} -> {response.status_code}")


if __name__ == "__main__":
    main()
