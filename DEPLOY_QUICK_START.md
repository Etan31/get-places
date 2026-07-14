# Deploy in 5 Minutes

## Option A: Vercel Frontend + Fly.io Backend (Recommended)

### Frontend (Vercel)

There's no `vercel.json` — this project relies entirely on Vercel's own Vite
auto-detection. That only works correctly if **Project Settings → General → Root
Directory** is set to `apps/client` (Vercel then finds the root `pnpm-lock.yaml`
automatically for install, and auto-detects the Vite build/output from
`apps/client/package.json`). If Root Directory is left blank, Vercel builds from the
monorepo root and won't find `apps/client`'s `index.html`.

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy setup"
git push

# 2. Go to https://vercel.com/import
# 3. Select your GitHub repo
# 4. IMPORTANT: set Root Directory = apps/client in the import screen
#    (or Project Settings → General → Root Directory afterward)
# 5. Vercel auto-deploys
# 6. Add env var in Vercel project settings:
#    VITE_API_BASE_URL=https://get-places.fly.dev
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

# 3. Register the app (fly.toml/Dockerfile already exist in this repo, but if
#    the app was deleted from Fly's side - or this is the first deploy - it
#    needs to be re-registered before `deploy` will work):
cd /path/to/get-places
flyctl launch
# flyctl detects the existing fly.toml/Dockerfile and offers to reuse them -
# accept that (don't let it regenerate a fresh Dockerfile). If it asks to
# overwrite/replace, decline the overwrite and keep the existing files.
# Name: get-places (must match fly.toml's `app =` if you want the same URL)
# Region: sin (or pick one close to you)
# Postgres: No
# Deploy: Yes (wait 2-3 min)

# If the app is already registered on Fly's side, skip straight to:
# flyctl deploy

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
