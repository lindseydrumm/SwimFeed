# run_all.py
# Runs every scraper in sequence.
# Usage: docker exec swimlive_backend uv run -m scrapers.run_all

from scrapers.rss_scrape import main as rss_main
from scrapers.events_scrape import main as events_main


def main():
    print("=== Running RSS scraper ===")
    rss_main()

    print("\n=== Running Events scraper ===")
    events_main()

    print("\n=== All scrapers finished ===")


if __name__ == "__main__":
    main()
