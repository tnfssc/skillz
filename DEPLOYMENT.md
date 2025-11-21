# Deployment Guide

This guide describes how to deploy the Skillz platform (API and Web) to Cloudflare.

## Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated (`wrangler login`)
- [Upstash Account](https://upstash.com/) for Redis (Rate Limiting)
- [Google Cloud Console](https://console.cloud.google.com/) project for OAuth

## 1. API Deployment (`apps/api`)

The API is a Cloudflare Worker using D1 (Database) and R2 (Storage).

### Step 1: Set Secrets

Set the required secrets:

```bash
cd apps/api

# Google OAuth
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# Upstash Redis (for Rate Limiting)
wrangler secret put UPSTASH_REDIS_REST_URL
wrangler secret put UPSTASH_REDIS_REST_TOKEN
```

### Step 2: Deploy

The first deploy will automatically provision the D1 database and R2 bucket:

```bash
pnpm run deploy
# or from root:
pnpm run deploy
```

> **Note**: The D1 database ID and R2 bucket name are already configured in `wrangler.toml`.

## 2. Web Deployment (`apps/web`)

The Web app is a static site (Vite + React) deployed to Cloudflare Pages.

### Step 1: Build

```bash
pnpm --filter @skillz/web build
```

### Step 2: Deploy

You can deploy directly using Wrangler:

```bash
cd apps/web
pnpm run deploy
# This runs: wrangler pages deploy dist
```

During the first deploy, you may be asked to create a new Pages project (e.g., `skillz-web`).

### Step 3: Environment Variables

For the web app to talk to the production API, you need to set the API URL.
Since it's a static build, this is done at build time or via a `public/config.js` if dynamic.
Currently, the web app uses `/api` proxy in dev. For production, you should update `apps/web/src/lib/api.ts` to point to your production API worker URL (e.g., `https://skillz-api-prod.<your-subdomain>.workers.dev`) or configure a custom domain.

**Recommendation:**
Update `apps/web/.env.production`:

```
VITE_API_URL=https://your-api-worker-url.workers.dev
```

And ensure your API client uses this variable.

## 3. CLI Release

To release the CLI tool to users:

1. Tag a new version: `git tag v1.0.0`
2. Push tags: `git push origin v1.0.0`
3. The GitHub Action `release.yml` will automatically build and release binaries via GoReleaser.

## 4. Domain Setup

For a professional setup, configure custom domains in Cloudflare Dashboard:

- API: `api.skillz.lat` -> Worker
- Web: `skillz.lat` -> Pages Project

### Web App Configuration

When deploying the web app, ensure it knows where to find the API.
Update `apps/web/.env.production` (create if needed):

```
VITE_API_URL=https://api.skillz.lat
```
