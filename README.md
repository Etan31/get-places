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

Response:

```json
{
  "rows": [
    {
      "shopName": "Example Coffee",
      "email": "-",
      "number": "-",
      "accountLink": "https://www.instagram.com/example",
      "category": "coffee shop",
      "location": "Cebu City"
    }
  ],
  "csv": "Shop Name,Email,Number,..."
}
```

The scraper only uses public pages, runs without login, and stops at the configured result limit.
