# Skillz Registry API

The backend API for the Skillz package manager, built with Hono and Cloudflare Workers.

## Local Development

### Prerequisites

- Node.js 20+
- pnpm

### Setup

1.  Install dependencies:

    ```bash
    pnpm install
    ```

2.  Initialize Database:

    ```bash
    pnpm run db:migrate
    pnpm run db:seed
    ```

3.  Run Development Server:
    ```bash
    pnpm run dev
    ```
    The API will be available at `http://localhost:8787`.

## API Reference

### Authentication

#### `POST /api/v1/auth/login`

Authenticate a user and receive a bearer token.

**Request:**

```json
{
  "username": "alice",
  "password": "password"
}
```

**Response:**

```json
{
  "token": "mock-token-...",
  "user": { "username": "alice" }
}
```

### Skills

#### `GET /api/v1/skills/:name`

Get metadata for a specific skill, including all versions.

**Response:**

```json
{
  "name": "my-skill",
  "versions": [
    {
      "version": "1.0.0",
      "tarballUrl": "...",
      "integrity": "sha256-..."
    }
  ]
}
```

#### `POST /api/v1/skills`

Publish a new version of a skill. Requires Authentication.

**Headers:**

- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Fields:**

- `name`: Package name
- `version`: Package version
- `tarball`: The `.tgz` file

### Tarballs

#### `GET /api/v1/tarballs/:name/:filename`

Download a package tarball.
