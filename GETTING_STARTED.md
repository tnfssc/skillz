# Skillz Monorepo - Getting Started

## What's Been Built

A complete monorepo structure for the Skillz package manager with:

### ✅ Go CLI Tool
- Full command structure (init, add, install, update, remove, list, search, info)
- Skillz.yaml parser with validation
- Type definitions for manifest and lock files
- Built and working at `./dist/skillz`

### ✅ Cloudflare Workers API (Hono)
- Edge-native API structure
- D1 database integration (Drizzle ORM)
- R2 storage bindings
- Vectorize for semantic search
- Core API endpoints defined

### ✅ Packages
- `@skillz/shared` - Shared TypeScript types
- `@skillz/db` - Drizzle ORM schema for D1 database

### ✅ Infrastructure
- pnpm workspaces for monorepo
- TypeScript configurations
- Wrangler setup for Workers deployment
- Comprehensive .gitignore

## Quick Start Commands

### Install Dependencies
```bash
pnpm install
```

### Build CLI
```bash
pnpm build:cli
# or
cd cli && go build -o ../dist/skillz ./cmd/skillz
```

### Test CLI
```bash
./dist/skillz --help
./dist/skillz init
```

### Run API Locally
```bash
pnpm dev
```

### Setup Cloudflare Resources

1. **Create D1 Database:**
```bash
cd apps/api
wrangler d1 create skillz-registry
# Copy the database_id to wrangler.toml
```

2. **Create R2 Bucket:**
```bash
wrangler r2 bucket create skillz-packages
```

3. **Create Vectorize Index:**
```bash
wrangler vectorize create skillz-embeddings --dimensions=768 --metric=cosine
```

4. **Run Database Migrations:**
```bash
cd ../../packages/db
pnpm drizzle-kit generate
cd ../../apps/api
wrangler d1 execute skillz-registry --file=../../packages/db/migrations/0001_initial.sql
```

## Project Structure

```
skillz.hot/
├── cli/                    # Go CLI tool
│   ├── cmd/skillz/        # Main entry point
│   │   └── main.go        # ✅ CLI commands
│   ├── internal/          
│   │   ├── config/        # ✅ Types
│   │   ├── parser/        # ✅ YAML parser
│   │   ├── installer/     # TODO: Installation logic
│   │   ├── resolver/      # TODO: Dependency resolution
│   │   └── git/           # TODO: Git operations
│   ├── go.mod            # ✅ Go dependencies
│   └── go.sum
│
├── apps/
│   ├── api/               # ✅ Cloudflare Workers API
│   │   ├── src/index.ts  # ✅ Hono server
│   │   ├── wrangler.toml # ✅ Cloudflare config
│   │   └── package.json
│   └── web/              # TODO: Web frontend
│
├── packages/
│   ├── shared/           # ✅ Shared TypeScript types
│   │   ├── src/index.ts
│   │   └── package.json
│   └── db/               # ✅ Database schema
│       ├── src/schema.ts # ✅ Drizzle ORM
│       ├── drizzle.config.ts
│       └── package.json
│
├── docs/                  # ✅ Documentation
│   └── SKILL_FORMAT.md    # ✅ Skill format spec
│
├── package.json           # ✅ Root workspace config
├── pnpm-workspace.yaml    # ✅ Workspace definition
├── .gitignore            # ✅ Git ignore rules
└── README.md             # ✅ Main README

```

## Next Steps

### Phase 1: CLI Foundation (Current)
- [ ] Implement `skillz init` command
- [ ] Implement `skillz add` command with registry lookup
- [ ] Implement basic dependency resolution
- [ ] Implement `skillz install` command
- [ ] Add git repository support
- [ ] Integrate with mise for CLI tools

### Phase 2: Registry Backend
- [ ] Implement user authentication (JWT)
- [ ] Implement skill publishing endpoint
- [ ] Implement search with Vectorize/D1 FTS
- [ ] Add download tracking
- [ ] Implement package storage on R2

### Phase 3: Web Platform
- [ ] Create Hono SSR web frontend
- [ ] Build homepage with search
- [ ] Create skill detail pages
- [ ] Add user profiles
- [ ] Documentation site

## Development Workflow

### CLI Development
```bash
cd cli
go run cmd/skillz/main.go <command>
go test ./...
```

### API Development
```bash
cd apps/api
pnpm dev           # Start local dev server
pnpm deploy        # Deploy to Cloudflare
```

### Database Changes
```bash
cd packages/db
# Edit src/schema.ts
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

## Architecture Decisions

- **Monorepo**: Single repo for all components
- **CLI**: Go for performance and easy distribution
- **Backend**: Cloudflare Workers + Hono for edge performance
- **Database**: D1 (serverless SQLite) with Drizzle ORM
- **Storage**: R2 for package tarballs
- **Search**: Vectorize + Workers AI for semantic search
- **Package Manager**: pnpm for efficient workspace management

## Tech Stack Summary

| Component | Technology | Status |
|-----------|-----------|--------|
| CLI | Go + Cobra | ✅ Built |
| API | Cloudflare Workers + Hono | ✅ Structure |
| Web | Cloudflare Workers + Hono SSR | 🚧 TODO |
| Database | D1 + Drizzle ORM | ✅ Schema |
| Storage | Cloudflare R2 | 🚧 Config |
| Search | Vectorize + Workers AI | 🚧 Config |
| Monorepo | pnpm workspaces | ✅ Setup |

---

🎉 **The foundation is ready!** You can now start implementing the core CLI commands and expanding the API endpoints.
