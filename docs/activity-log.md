# Activity Log

## 2026-07-14

- Created a local-first React and Express scraper project from an empty workspace.
- Chose no login, no database, and no paid API dependencies for the first version.
- Added Playwright-based Google Maps discovery with website enrichment for email and social links.
- Fixed "Scraping..." appearing stuck forever: `/api/scrape` was one blocking request that scraped all rows before responding (measured ~11.5s/row, so 50 rows took 8-10 min with zero feedback). Switched to a streamed newline-delimited JSON response so the client renders rows as they're found and shows live status text. The "WebSocket pending" seen in devtools was Vite's own HMR socket, unrelated to the scrape request; no WebSocket exists in this app.
- Replaced the fixed 450ms inter-row delay with a randomized 1.2-2.6s delay, and capped website-signal checks to 2 pages (was up to 4) with tighter navigation timeouts, to reduce the chance of Google Maps or slow target sites blocking/rate-limiting a 50-row run.
- Fixed disconnect-detection bug introduced during this change: `request.on('close')` fires as soon as Express finishes reading the request body (immediately, since `express.json()` already consumed it), not on real client disconnect - this caused every scrape to cancel itself instantly. Switched to `response.on('close')` guarded by `!response.writableEnded`, which only fires on genuine premature disconnects.
