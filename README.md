# 🎉 skillz.lat - Package Manager for Claude Skills

A modern, full-stack package manager for discovering, sharing, and managing Claude MCP skills. Built with Go CLI, Cloudflare Workers, and edge-native architecture.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build and use CLI
cd cli && go build -o ../dist/skillz ./cmd/skillz
./dist/skillz --help

# Run API locally
cd apps/api && pnpm dev

# Run Web app locally
cd apps/web && pnpm dev
```

## 📁 Project Structure

```
skillz.lat/
├── cli/                           # Go CLI for package management
│   ├── cmd/skillz/                # CLI commands (init, add, install, etc.)
│   └── internal/
│       ├── auth/                  # Authentication handling
│       ├── config/                # Configuration types
│       ├── git/                   # Git operations
│       ├── installer/             # Package installation logic
│       ├── lockfile/              # Lock file management
│       ├── packager/              # Package creation
│       ├── parser/                # YAML parsing
│       ├── registry/              # Registry client
│       └── resolver/              # Dependency resolution
│
├── apps/
│   ├── api/                       # REST API (Cloudflare Workers + Hono)
│   │   ├── src/index.ts           # API endpoints
│   │   ├── src/index.test.ts      # API tests
│   │   └── wrangler.toml          # Cloudflare configuration
│   │
│   └── web/                       # Web frontend (Hono SSR)
│       ├── src/index.tsx          # Routes and pages
│       ├── src/components/        # UI components
│       └── wrangler.toml          # Cloudflare configuration
│
├── packages/
│   ├── db/                        # Database schema (Drizzle ORM)
│   │   ├── src/schema.ts          # D1 database schema
│   │   ├── seed.sql               # Seed data
│   │   └── drizzle.config.ts      # Drizzle configuration
│   │
│   └── shared/                    # Shared TypeScript types
│       └── src/index.ts           # Common types
│
├── docs/                          # Documentation
│   └── SKILL_FORMAT.md            # Skill manifest specification
│
└── dist/
    └── skillz                     # Built CLI binary
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| CLI | Go 1.21+, Cobra |
| API | Cloudflare Workers, Hono, Drizzle ORM |
| Web | Hono SSR, TypeScript, JSX |
| Database | Cloudflare D1 (serverless SQLite) |
| Storage | Cloudflare R2 (S3-compatible) |
| Search | Vectorize, Workers AI |
| Package Manager | pnpm workspaces |

## 🔧 Environment Variables & Configuration

### API Service (`apps/api/`)

Configuration is managed via `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "skillz-registry"
database_id = "YOUR_D1_DATABASE_ID"  # Get from: wrangler d1 create skillz-registry

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "skillz-packages"      # Create with: wrangler r2 bucket create skillz-packages

[[vectorize]]
binding = "VECTORIZE"
index_name = "skillz-embeddings"     # Create with: wrangler vectorize create

[ai]
binding = "AI"                        # Workers AI for embeddings
```

**Required Bindings:**
- `DB` - D1 database for skill metadata
- `BUCKET` - R2 bucket for package tarballs
- `VECTORIZE` - Vector database for semantic search
- `AI` - Workers AI for generating embeddings

### Web Service (`apps/web/`)

Same D1 and R2 bindings as API:

```toml
[[d1_databases]]
binding = "DB"
database_name = "skillz-registry"
database_id = "YOUR_D1_DATABASE_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "skillz-packages"
```

### CLI Tool

No environment variables required for basic usage. Configuration stored in:
- `skillz.yaml` - Project manifest (dependencies, metadata)
- `skillz.lock` - Lock file (exact versions, checksums)
- `.skillz/` - Local installation directory

## 📦 Database Setup

### 1. Create D1 Database

```bash
cd apps/api
wrangler d1 create skillz-registry
```

Copy the returned `database_id` to `wrangler.toml` in both `apps/api/` and `apps/web/`.

### 2. Generate and Run Migrations

```bash
cd packages/db

# Generate migrations from schema
pnpm drizzle-kit generate

# Apply migrations to D1
cd ../../apps/api
wrangler d1 execute skillz-registry --local --file=../../packages/db/migrations/0001_initial.sql

# For production
wrangler d1 execute skillz-registry --remote --file=../../packages/db/migrations/0001_initial.sql
```

### 3. Seed Demo Data (Optional)

```bash
cd apps/api
wrangler d1 execute skillz-registry --local --file=../../packages/db/seed.sql
```

This creates 5 demo skills with versions, reviews, and download statistics.

## 🚢 Deployment

### Prerequisites

1. Install Wrangler CLI:
   ```bash
   pnpm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Create required resources (see Database Setup above)

### Deploy API

```bash
cd apps/api

# Deploy to production
pnpm deploy

# Your API will be live at: https://skillz-api.YOUR_SUBDOMAIN.workers.dev
```

### Deploy Web App

```bash
cd apps/web

# Deploy to production
pnpm deploy

# Your web app will be live at: https://skillz-web.YOUR_SUBDOMAIN.workers.dev
```

### Build and Distribute CLI

```bash
cd cli

# Build for current platform
go build -o ../dist/skillz ./cmd/skillz

# Build for multiple platforms
GOOS=linux GOARCH=amd64 go build -o ../dist/skillz-linux-amd64 ./cmd/skillz
GOOS=darwin GOARCH=amd64 go build -o ../dist/skillz-darwin-amd64 ./cmd/skillz
GOOS=darwin GOARCH=arm64 go build -o ../dist/skillz-darwin-arm64 ./cmd/skillz
GOOS=windows GOARCH=amd64 go build -o ../dist/skillz-windows-amd64.exe ./cmd/skillz
```

## 🎯 CLI Commands

```bash
# Initialize a new skill project
skillz init

# Add dependencies
skillz add data-analyzer                    # From registry
skillz add data-analyzer@1.2.0             # Specific version
skillz add github.com/user/repo            # From git
skillz add github.com/user/repo#branch     # Specific branch/tag
skillz add ./local-skill --dev             # Local dependency

# Install dependencies
skillz install

# Remove dependencies
skillz remove data-analyzer

# List installed skills
skillz list

# Search registry
skillz search "data analysis"

# Get skill info
skillz info data-analyzer
```

## 🌐 API Endpoints

```
GET  /api/v1/skills              List all skills
GET  /api/v1/skills/:name        Get skill details
GET  /api/v1/skills/:name/versions  Get all versions
GET  /api/v1/search?q=query      Search skills
GET  /api/v1/stats               Registry statistics
GET  /api/v1/users/:username     User profile
POST /api/v1/skills              Publish skill (requires auth)
```

## 📝 Development Workflow

### CLI Development

```bash
cd cli

# Run without building
go run cmd/skillz/main.go <command>

# Run tests
go test ./...

# Run specific test
go test ./internal/installer -v

# Build
go build -o ../dist/skillz ./cmd/skillz
```

### API Development

```bash
cd apps/api

# Start dev server (uses local D1)
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Deploy to production
pnpm deploy
```

### Web Development

```bash
cd apps/web

# Start dev server
pnpm dev

# Visit http://localhost:8788

# Deploy to production
pnpm deploy
```

### Database Changes

```bash
cd packages/db

# 1. Edit src/schema.ts
# 2. Generate migration
pnpm drizzle-kit generate

# 3. Apply to local D1
cd ../../apps/api
wrangler d1 execute skillz-registry --local --file=../../packages/db/migrations/<new-migration>.sql

# 4. Apply to production
wrangler d1 execute skillz-registry --remote --file=../../packages/db/migrations/<new-migration>.sql
```

## ✅ Testing

```bash
# Test CLI
cd cli && go test ./...

# Test API
cd apps/api && pnpm test

# E2E tests
cd cli/e2e && go test -v
```

## 📚 Documentation

- [AGENTS.md](./AGENTS.md) - Guide for LLMs working with this codebase
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Detailed setup guide
- [PROGRESS.md](./PROGRESS.md) - Development progress tracker
- [docs/SKILL_FORMAT.md](./docs/SKILL_FORMAT.md) - Skill manifest specification
- [CLI_TESTS.md](./CLI_TESTS.md) - CLI testing documentation

## 🎨 Features

### CLI (Go)
- ✅ Dependency management (add, remove, install)
- ✅ YAML parsing and validation
- ✅ Lock file generation with checksums
- ✅ Git repository support
- ✅ Local package caching
- ✅ Multiple source support (registry, git, local)

### API (Cloudflare Workers)
- ✅ RESTful skill registry
- ✅ Search functionality
- ✅ User profiles
- ✅ Download statistics
- ✅ Version management
- 🚧 Authentication (in progress)
- 🚧 Semantic search with Vectorize

### Web (Hono SSR)
- ✅ Browse and search skills
- ✅ Skill detail pages with versions
- ✅ User reviews and ratings
- ✅ Dark theme with glassmorphism
- ✅ Fully responsive design
- ✅ SEO-optimized server-side rendering

### Database
- ✅ Skills, versions, tags
- ✅ User profiles and reviews
- ✅ Download tracking
- ✅ Full-text search support
- ✅ Seed data for development

## 🔮 Roadmap

- [ ] User authentication and publishing
- [ ] GitHub OAuth integration
- [ ] Semantic search with embeddings
- [ ] Automated testing on publish
- [ ] CLI tool versioning with mise
- [ ] Package signing and verification
- [ ] Dependency vulnerability scanning
- [ ] Analytics dashboard

## 🤝 Contributing

See [AGENTS.md](./AGENTS.md) for guidance on working with this codebase.

## 📄 License

MIT

---

**Built with ❤️ using Cloudflare's edge platform**
