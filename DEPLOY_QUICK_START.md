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
```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Create account and login
flyctl auth signup
# or
flyctl auth login

# 3. Deploy from project root
cd /path/to/get-places
flyctl launch
# Name: get-places-server
# Region: pick one
# Postgres: No
# Deploy: Yes

# 4. Get your URL
flyctl info
# Copy the public URL

# 5. Update Vercel env var with the URL
```

**Done! Both are live.**

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
