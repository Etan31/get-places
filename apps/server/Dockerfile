FROM node:22-slim

WORKDIR /app

# Copy only package files first for better caching
COPY pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN npm install -g pnpm && pnpm install --filter @get-places/server

# Copy server code
COPY apps/server/src ./apps/server/src

# Install Playwright browsers
RUN cd apps/server && pnpm exec playwright install --with-deps chromium

# Set environment
ENV NODE_ENV=production
ENV SCRAPER_HEADLESS=true
ENV PORT=3001

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "apps/server/src/server.js"]
