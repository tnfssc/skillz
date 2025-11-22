# Skillz - Getting Started

## What's Been Built

A complete platform for the Skillz package manager with:

### ✅ Go CLI Tool

- Full command structure (init, add, install, update, remove, list, search, info, publish)
- Skillz.toon parser with validation (TOON format)
- Type definitions for manifest and lock files
- Integrity checking with SHA256 checksums
- Built and working at `./dist/skillz`

### ✅ Cloudflare Workers API (Hono SSR)

- Edge-native API with server-side rendering
- D1 database integration (Drizzle ORM)
- R2 storage for package tarballs
- Better-auth authentication (Google OAuth)
- Upstash Redis for rate limiting
- Responsive UI with Tailwind CSS
- Interactive documentation pages

### ✅ Database

- Drizzle ORM schema for D1 database
- User authentication tables
- Skills and versions registry
- Migration system

### ✅ Infrastructure

- Simple, flat project structure
- TypeScript configurations
- Wrangler setup for Workers deployment
- Comprehensive .gitignore
- CI/CD with GitHub Actions

## Quick Start Commands

### Install Dependencies

```bash
# Server dependencies
cd server && pnpm install
```

### Build CLI

```bash
cd cli && go build -o ../dist/skillz ./cmd/skillz
```

### Test CLI

```bash
./dist/skillz --help
./dist/skillz init
```

### Run API Locally

```bash
# From root
pnpm dev

# Or directly in server
cd server && pnpm dev
```

### Setup Cloudflare Resources

1. **Create D1 Database:**

```bash
cd server
wrangler d1 create skillz-registry
# Copy the database_id to wrangler.toml
```

2. **Create R2 Bucket:**

```bash
wrangler r2 bucket create skillz-packages
```

3. **Run Database Migrations:**

```bash
cd server
pnpm run db:migrate:local  # For local development
pnpm run db:migrate        # For production
```

## Project Structure

```
skillz.hot/
├── cli/                    # Go CLI tool
│   ├── cmd/skillz/        # Main entry point
│   │   └── main.go        # ✅ CLI commands
│   ├── internal/
│   │   ├── config/        # ✅ Types & config
│   │   ├── parser/        # ✅ TOON parser
│   │   ├── installer/     # ✅ Installation logic
│   │   ├── resolver/      # ✅ Dependency resolution
│   │   └── git/           # ✅ Git operations
│   ├── go.mod            # ✅ Go dependencies
│   └── go.sum
│
├── server/                # ✅ Hono SSR app
│   ├── src/              # Application code
│   │   ├── index.tsx     # ✅ Main server
│   │   ├── auth.ts       # ✅ Authentication
│   │   ├── pages/        # ✅ SSR pages
│   │   └── lib/          # ✅ Shared utilities
│   ├── db/               # ✅ Database
│   │   ├── src/          # Schema definitions
│   │   └── migrations/   # SQL migrations
│   ├── public/           # Static assets
│   ├── wrangler.toml     # ✅ Cloudflare config
│   └── package.json
│
├── examples/             # Example skills
│   └── dummy-skill/      # ✅ Example skill
│
├── docs/                 # ✅ Documentation
│   └── SKILL_FORMAT.md   # ✅ Skill format spec
│
├── package.json          # ✅ Root scripts
└── README.md            # ✅ Main README
```

## Development Workflow

### CLI Development

```bash
cd cli
go run cmd/skillz/main.go <command>
go test ./...
```

### Server Development

```bash
cd server
pnpm dev           # Start local dev server
pnpm deploy        # Deploy to Cloudflare
```

### Database Changes

```bash
cd server/db
# Edit src/schema.ts
pnpm drizzle-kit generate
cd ..
pnpm run db:migrate:local
```

## Architecture Decisions

- **Simple Structure**: Flat layout with `cli/` and `server/` at root
- **CLI**: Go for performance and easy distribution
- **Backend**: Cloudflare Workers + Hono for edge performance with SSR
- **Database**: D1 (serverless SQLite) with Drizzle ORM
- **Storage**: R2 for package tarballs
- **Auth**: Better-auth with Google OAuth
- **Rate Limiting**: Upstash Redis

## Tech Stack Summary

| Component  | Technology                | Status    |
| ---------- | ------------------------- | --------- |
| CLI        | Go + Cobra                | ✅ Built  |
| Server     | Cloudflare Workers + Hono | ✅ Built  |
| UI         | Hono JSX + Tailwind CSS   | ✅ Built  |
| Database   | D1 + Drizzle ORM          | ✅ Schema |
| Storage    | Cloudflare R2             | ✅ Config |
| Auth       | Better-auth               | ✅ Setup  |
| Rate Limit | Upstash Redis             | ✅ Setup  |

---

🎉 **The platform is functional!** You can now publish and manage AI skills through the registry.
