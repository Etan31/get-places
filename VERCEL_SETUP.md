# Vercel Deployment Setup

This guide walks through deploying Get Places to Vercel.

## Option 1: Frontend on Vercel + Backend on Fly.io (Recommended)

This is the **easiest and most reliable** for a Playwright-based scraper.

### Step 1: Deploy Frontend to Vercel

1. **Connect GitHub repo to Vercel**
   - Go to https://vercel.com/import
   - Select your GitHub repo
   - Vercel auto-detects the monorepo structure and builds `apps/client`
   - Click "Deploy"

2. **Set environment variables** in Vercel project settings:
   ```
   VITE_API_BASE_URL=https://get-places-server.fly.dev
   ```
   (Replace with your Fly.io URL after deploying the server)

3. **That's it!** Frontend is live.

---

### Step 2: Deploy Backend to Fly.io (Free Tier Available)

Fly.io is better suited for long-running scraping tasks than Vercel serverless.

1. **Install Fly.io CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create Fly.io account and authenticate**
   ```bash
   flyctl auth signup
   # or
   flyctl auth login
   ```

3. **Navigate to project root and initialize Fly.io**
   ```bash
   flyctl launch
   ```
   - Name: `get-places-server` (or your choice)
   - Region: pick one close to you
   - Database: No
   - When prompted to deploy: say "Yes"

4. **Update `apps/server/package.json`** — make sure start command exists:
   ```json
   {
     "scripts": {
       "dev": "node --watch src/server.js",
       "start": "node src/server.js"
     }
   }
   ```

5. **Deploy to Fly.io**
   ```bash
   flyctl deploy
   ```

6. **Get your public URL**
   ```bash
   flyctl info
   ```
   Copy the URL (e.g., `https://get-places-server.fly.dev`)

7. **Update Vercel env var**
   - Go to Vercel project settings
   - Set `VITE_API_BASE_URL=https://get-places-server.fly.dev`
   - Redeploy frontend

8. **Done!** Both frontend and backend are live.

---

## Option 2: Both on Vercel (Possible but Limited)

Vercel serverless functions work with Playwright, but have constraints:

### Limitations
- **Memory**: Default 1GB (enough for Playwright, but tight)
- **Timeout**: Default 60s (scraping 50 rows takes ~60-90s)
- **Cold starts**: First request may take 10-20s with Playwright

### Setup

1. **Upgrade to Vercel Pro** (needed for 300s timeout and higher memory)
   - Free tier max 60s timeout (not enough for a full scrape)

2. **Connect GitHub repo** and let Vercel auto-deploy

3. **Build will fail initially** because Playwright needs to be installed
   - Update `apps/server/package.json` to include `@vercel/ncc` for bundling
   - Or ensure Playwright is pre-built

4. **Set Vercel environment variables**:
   ```
   VITE_API_BASE_URL=/api/scrape
   SCRAPER_HEADLESS=true
   ```

5. **Update client to use relative API URL**
   - The frontend will automatically use `/api/scrape` instead of a full URL

### Pros
- Single deployment, no external services needed

### Cons
- Risky timeouts on large scrapes
- Expensive if you run many scrapes (Vercel charges per-execution)
- Playwright cold-start adds 10-20s to first request

---

## Recommended: Vercel Frontend + Fly.io Backend

**Why?**
- ✅ Free Fly.io tier is generous (3 shared-cpu machines, 3GB RAM)
- ✅ Backend can run as long as needed (no timeout on Fly.io)
- ✅ Frontend on Vercel stays fast and global
- ✅ Easiest to scale later
- ✅ Better cost/performance ratio

**Setup time**: ~5 minutes

---

## Environment Variables

### Vercel (Frontend)
```
VITE_API_BASE_URL=https://get-places-server.fly.dev
```

### Fly.io (Backend)
```
SCRAPER_HEADLESS=true
SCRAPER_CONCURRENCY=5  # adjust based on your needs
SCRAPER_MAX_RESULTS=50
```

---

## Troubleshooting

### "API returns 405 Method Not Allowed"
- Ensure backend server is running and accessible
- Check `VITE_API_BASE_URL` is set correctly in Vercel

### "Scrape times out"
- On Vercel: upgrade to Pro for 300s timeout
- On Fly.io: check logs with `flyctl logs`

### "Playwright not found"
- Ensure `apps/server/package.json` includes playwright
- Fly.io will auto-install on deploy

### Cold start is slow
- First request to Vercel serverless takes 10-20s (Playwright download)
- Subsequent requests are faster (cached)
- Fly.io is much faster for repeated requests

---

## Links

- **Vercel**: https://vercel.com
- **Fly.io**: https://fly.io
- **Playwright docs**: https://playwright.dev
