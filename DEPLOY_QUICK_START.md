# Deploy in 5 Minutes

## Option A: Vercel Frontend + Fly.io Backend (Recommended)

### Frontend (Vercel)
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy setup"
git push

# 2. Go to https://vercel.com/import
# 3. Select your GitHub repo
# 4. Vercel auto-deploys
# 5. Add env var in Vercel project settings:
#    VITE_API_BASE_URL=https://get-places-server.fly.dev
```

### Backend (Fly.io)

`fly.toml` and `Dockerfile` live at the **project root** (that's where `flyctl launch` was run,
and where it registered the app - don't move them into `apps/server/`, the Dockerfile is
monorepo-aware and only copies what the server needs).

```bash
# 1. Install Fly CLI
# macOS: brew install flyctl
# Linux: curl -L https://fly.io/install.sh | sh
# Windows: https://github.com/superfly/flyctl/releases (download .exe)

# 2. Create account and login
flyctl auth signup
# or
flyctl auth login

# 3. If you already ran `flyctl launch` once, the app is registered -
#    just redeploy with the fixed Dockerfile/.dockerignore:
cd /path/to/get-places
flyctl deploy

# First time only (no fly.toml/app registered yet), use launch instead:
# flyctl launch
# Name: get-places (or your choice)
# Region: pick one close to you
# Dockerfile: Yes (auto-detected)
# Postgres: No
# Deploy: Yes (wait 2-3 min)

# 4. Get your public URL
flyctl info
# Look for "Hostname" - copy it

# 5. Update Vercel environment variable with the URL from step 4
# Go to Vercel project settings → Environment Variables
# VITE_API_BASE_URL=https://get-places.fly.dev
# (or whatever your fly.io hostname is)
```

**Done! Both are live.**

> If you hit `archive/tar: unknown file mode` during `flyctl deploy`/`launch`: this was caused by
> the build context including the entire monorepo (client app, docs, etc.) instead of just the
> server. `.dockerignore` now excludes `apps/client`, `docs`, `api`, `*.md`, and `vercel.json` -
> re-run `flyctl deploy` after pulling these changes.

---

## Option B: All on Vercel (Requires Pro)

```bash
# 1. Upgrade Vercel to Pro ($20/month) for 300s timeout
# 2. Push to GitHub
# 3. Vercel auto-deploys both
# 4. Set env var: VITE_API_BASE_URL=/api/scrape
```

⚠️ Not recommended — timeouts and cold starts can break scrapes.

---

## Test It

1. Go to your Vercel URL
2. Enter a city (e.g., "Cebu City")
3. Click "Start scrape"
4. Should see results stream in

---

## Costs

### Option A (Recommended)
- Vercel: Free tier (5 deployments/month)
- Fly.io: Free tier (3 shared machines, 3GB RAM)
- **Total: $0/month** (if you stay on free tiers)

### Option B
- Vercel Pro: $20/month
- Per-execution charges may apply
- **Total: $20+/month**

---

## See Also

- Full setup guide: `VERCEL_SETUP.md`
- Local development: `README.md`
