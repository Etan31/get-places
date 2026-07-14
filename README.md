# Get Places

Local personal-use scraper for finding small businesses by city and category.

## Stack

- Frontend: React, Vite, HTML/CSS
- Backend: Node 20, Express
- Scraping: Playwright

## Setup

```bash
pnpm install
pnpm --filter @get-places/server exec playwright install chromium
pnpm dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`

## API

`POST /api/scrape`

Body:

```json
{
  "city": "Cebu City",
  "category": "Food, Beverage & Entertainment (Discretionary Dining)",
  "keyword": "coffee shop",
  "limit": 50
}
```

Validation errors return a normal JSON error response (400). On success, the response streams as
newline-delimited JSON (`Content-Type: application/x-ndjson`) so the client can render rows as they're
found instead of waiting for the whole batch:

```json
{"type":"status","message":"Searching Google Maps for \"coffee shop in Cebu City\"..."}
{"type":"status","message":"Found 12 places, checking each one..."}
{"type":"row","row":{"shopName":"Example Coffee","email":"-","number":"-","accountLink":"https://www.instagram.com/example","facebookLink":"https://www.facebook.com/example","category":"coffee shop","location":"Cebu City","mapsUrl":"https://www.google.com/maps/place/Example+Coffee/..."},"index":1,"total":50}
{"type":"done","count":12,"csv":"Shop Name,Email,Number,..."}
```

An `{"type":"error","message":"..."}` line can appear instead of `done` if the scrape fails partway
through (the HTTP status is already 200 by then since streaming has started).

The scraper only uses public pages, runs without login, and stops at the configured result limit. Each
row includes its `mapsUrl` (the Google Maps listing) so you can jump straight to it.

Rows are scraped concurrently (`SCRAPER_CONCURRENCY`, default `5`) to cut wall-clock time for a 50-row
run, with a randomized 1.2-2.6s delay between requests on each worker to avoid triggering rate limiting
or blocking from Google Maps or target sites. Raise `SCRAPER_CONCURRENCY` for more speed at the cost of
higher block risk; lower it if you start seeing captchas or empty results.
