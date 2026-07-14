# Vercel Deployment Setup

This guide walks through deploying Get Places to Vercel.

## Option 1: Frontend on Vercel + Backend on Fly.io (Recommended)

This is the **easiest and most reliable** for a Playwright-based scraper.

### Step 1: Deploy Frontend to Vercel

1. **Connect GitHub repo to Vercel**
   - Go to https://vercel.com/import
   - Select your GitHub repo
   - **Set Root Directory to `apps/client`** (in the import screen, or afterward via
     Project Settings → General → Root Directory). This project has no `vercel.json` -
     it relies on Vercel's zero-config Vite detection, which only works from
     `apps/client` (that's where `index.html` and the Vite `package.json` live). Vercel
     still auto-runs `pnpm install` from the true repo root (it walks up to find
     `pnpm-lock.yaml`), so the pnpm workspace resolves correctly either way.
   - Click "Deploy"

2. **Set environment variables** in Vercel project settings:
   ```
   VITE_API_BASE_URL=https://get-places.fly.dev
   ```
   (Replace `get-places` with your actual Fly.io app name/hostname after deploying the server)

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

3. **Navigate to project root and initialize Fly.io** (`fly.toml` and `Dockerfile` live at the
   repo root, not inside `apps/server/` — the Dockerfile is monorepo-aware and only installs/copies
   what the server needs, so the app must be deployed from the root)
   ```bash
   flyctl launch
   ```
   - flyctl detects the existing `fly.toml`/`Dockerfile` and offers to reuse them — accept
     that rather than letting it regenerate fresh config
   - Name: `get-places` (must match `fly.toml`'s `app =` to keep the same URL)
   - Region: `sin` (or pick one close to you)
   - Database: No
   - When prompted to deploy: say "Yes"

   If the app is already registered on Fly's side (not deleted), skip straight to
   `flyctl deploy` instead — running `launch` again on an existing app can prompt to
   reconfigure it unnecessarily.

4. **Deploy to Fly.io**
   ```bash
   flyctl deploy
   ```

5. **Get your public URL**
   ```bash
   flyctl info
   ```
   Copy the hostname (e.g., `https://get-places.fly.dev`)

6. **Update Vercel env var**
   - Go to Vercel project settings
   - Set `VITE_API_BASE_URL=https://get-places.fly.dev` (your actual hostname)
   - Redeploy frontend

7. **Done!** Both frontend and backend are live.

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
VITE_API_BASE_URL=https://get-places.fly.dev
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

### "No Output Directory named 'dist' found" on Vercel
- This means Vercel's Root Directory setting doesn't match where `vercel.json` (if any)
  expects output. This project has no `vercel.json` on purpose — set **Project Settings
  → General → Root Directory** to `apps/client` and let Vercel's Vite auto-detection
  handle build/output. A root-level `vercel.json` is silently ignored whenever Root
  Directory points at a subfolder, since Vercel looks for `vercel.json` *inside* that
  subfolder instead - which is exactly what caused this error.

### `apt-get install` fails / `vite: not found` / build succeeds but nothing works
- Double-check `Dockerfile` for truncated lines before assuming a config problem — pasting
  it into a web textarea (Fly's launch UI, GitHub's web editor, etc.) can silently cut long
  lines mid-word, and the result still looks like valid-ish Docker syntax at a glance. Grep
  for the actual package names (`build-essential`, `python-is-python3`) to confirm they're
  intact rather than eyeballing it.

### `archive/tar: unknown file mode ?rwxr-xr-x` during `flyctl deploy`/`launch`
- This happens when the Docker build context includes the whole monorepo (client app source,
  docs, node_modules, etc.) instead of just what the server needs — something in that larger
  context trips the tar archiver used to upload the build context.
- Fixed by tightening `.dockerignore` (excludes `apps/client`, `docs`, `api`, `*.md`, `vercel.json`,
  `node_modules`) and rewriting the root `Dockerfile` to only `COPY` the workspace manifests +
  `apps/server` — never the whole repo (`COPY . .`).
- If it recurs: check for symlinks/reparse points outside `node_modules` in the repo
  (`Get-ChildItem -Recurse -Force | Where-Object { $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint }`
  on Windows), and consider `flyctl deploy --local-only` to bypass the remote Depot builder.

---

## Links

- **Vercel**: https://vercel.com
- **Fly.io**: https://fly.io
- **Playwright docs**: https://playwright.dev
