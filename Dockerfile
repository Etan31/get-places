# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.20.0
FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NODE_ENV="production"

ARG PNPM_VERSION=9.15.4
RUN npm install -g pnpm@$PNPM_VERSION


FROM base AS build

# System deps needed to build native node modules and run Playwright's browser install
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential python-is-python3

# Copy only the workspace manifests first (better layer caching, and keeps
# the install step reproducible from the lockfile without pulling in source).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/client/package.json ./apps/client/
COPY apps/server/package.json ./apps/server/

# Install just the server's dependency subtree (skips client deps like react/vite)
RUN pnpm install --frozen-lockfile --filter @get-places/server...

# Now copy the actual server source
COPY apps/server ./apps/server

# Install the Playwright browser binary the scraper needs
RUN cd apps/server && pnpm exec playwright install --with-deps chromium


FROM base

COPY --from=build /app /app

EXPOSE 3001
CMD ["node", "apps/server/src/server.js"]
