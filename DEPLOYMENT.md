# Deployment Guide

This guide describes how to deploy the Skillz platform (API and Web) to Cloudflare.

## Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated (`wrangler login`)
- [Upstash Account](https://upstash.com/) for Redis (Rate Limiting)
- [Google Cloud Console](https://console.cloud.google.com/) project for OAuth

## 1. Server Deployment

The server is a Cloudflare Worker with Hono SSR using D1 (Database) and R2 (Storage).

### Step 1: Set Secrets

Set the required secrets:

```bash
cd server

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
pnpm build
```

> **Note**: The D1 database ID and R2 bucket name are already configured in `wrangler.toml`.

## 2. Domain Setup

For a professional setup, configure custom domains in Cloudflare Dashboard:

- Main site: `skillz.lat` → Worker (server)

The server handles both the SSR frontend and API endpoints, so you only need one domain.

### Environment Variables

Update `server/.dev.vars` for local development and wrangler secrets for production:

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

## Example Production Configuration

```bash
# Required environment variables (set via wrangler secret)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
BETTER_AUTH_URL=https://skillz.lat
ENVIRONMENT=production
```
