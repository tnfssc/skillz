# AGENTS.md - LLM Guide to skillz.lat Codebase

This document provides guidance for AI agents (LLMs) working with the skillz.lat codebase. It explains the architecture, conventions, and best practices to help you navigate and contribute effectively.

## 📐 Architecture Overview

skillz.lat is a **monorepo** organized as three main components:

```
┌─────────────────────────────────────────────────────────┐
│                     User Interaction                     │
└───────────┬─────────────────────────────────┬───────────┘
            │                                 │
    ┌───────▼────────┐              ┌────────▼────────┐
    │   CLI (Go)     │              │  Web (Hono SSR) │
    │  ./cli/        │              │  apps/web/      │
    └───────┬────────┘              └────────┬────────┘
            │                                │
            │         ┌──────────────────────┘
            │         │
       ┌────▼─────────▼─────┐
       │   API (Hono)       │
       │   apps/api/        │
       └────┬───────┬───────┘
            │       │
    ┌───────▼───┐ ┌▼──────────┐
    │ D1 (SQL)  │ │ R2 (Blob) │
    │ packages/ │ │ Packages  │
    │   db/     │ │ Storage   │
    └───────────┘ └───────────┘
```

### Component Responsibilities

1. **CLI (`cli/`)** - Go-based command-line tool
   - Manages local `skillz.yaml` and `skillz.lock` files
   - Resolves and installs dependencies
   - Communicates with registry API
   - Handles git repositories and local packages

2. **API (`apps/api/`)** - Cloudflare Workers REST API
   - Serves skill metadata from D1 database
   - Handles package uploads to R2
   - Provides search and discovery
   - Manages user authentication (future)

3. **Web (`apps/web/`)** - Server-side rendered web app
   - Browse and search skills
   - User-friendly interface for discovery
   - Documentation and guides
   - Edge-rendered with Hono on Cloudflare Workers

4. **Database (`packages/db/`)** - Drizzle ORM schema
   - Defines D1 database structure
   - Manages migrations
   - Shared by both API and Web

5. **Shared (`packages/shared/`)** - TypeScript types
   - Common type definitions
   - Used across API, Web, and potentially CLI (via code generation)

## 🗂️ File Organization

### CLI Structure (`cli/`)

```
cli/
├── cmd/skillz/main.go          # Entry point, Cobra command setup
├── internal/
│   ├── auth/                   # Authentication with API
│   │   └── auth.go
│   ├── config/                 # Type definitions
│   │   └── types.go            # Manifest, Dependency, LockFile types
│   ├── git/                    # Git operations
│   │   └── git.go              # Clone, checkout
│   ├── installer/              # Package installation
│   │   ├── installer.go        # Main installation logic
│   │   └── installer_test.go   # Tests
│   ├── lockfile/               # Lock file management
│   │   └── lockfile.go         # Generate/parse skillz.lock
│   ├── packager/               # Package creation for publishing
│   │   └── packager.go
│   ├── parser/                 # YAML parsing
│   │   ├── parser.go           # Parse skillz.yaml
│   │   └── parser_test.go      # Tests
│   ├── registry/               # API client
│   │   ├── client.go           # HTTP client for registry API
│   │   └── client_test.go
│   └── resolver/               # Dependency resolution
│       ├── resolver.go         # Resolve dependency tree
│       ├── git.go              # Git-specific resolution
│       └── registry.go         # Registry-specific resolution
├── go.mod
└── go.sum
```

**Key Patterns:**

- Each `internal/` subdirectory is a package (e.g., `package installer`)
- Tests are co-located with implementation (`*_test.go`)
- Types are centralized in `config/types.go`
- External dependencies: `gopkg.in/yaml.v3`, `github.com/spf13/cobra`

### API Structure (`apps/api/`)

```
apps/api/
├── src/
│   ├── index.ts           # Main Hono app, route definitions
│   └── index.test.ts      # Vitest tests
├── wrangler.toml          # Cloudflare Workers config
├── package.json
└── tsconfig.json
```

**Key Patterns:**

- Single-file API (can be split into modules as it grows)
- Uses Hono for routing: `app.get('/api/v1/skills', handler)`
- Drizzle ORM for database queries
- Bindings injected via `c.env`: `c.env.DB`, `c.env.BUCKET`, etc.

### Web Structure (`apps/web/`)

```
apps/web/
├── src/
│   ├── index.tsx          # Main app, routes, page components
│   └── components/
│       └── Layout.tsx     # Shared layout component
├── wrangler.toml
├── package.json
└── DESIGN.md              # Design system documentation
```

**Key Patterns:**

- Hono SSR with JSX
- Inline CSS for styling (no build step)
- Server-side data fetching
- Returns HTML directly (not a SPA)

### Database Structure (`packages/db/`)

```
packages/db/
├── src/
│   └── schema.ts          # Drizzle schema definitions
├── migrations/            # Generated SQL migrations
├── seed.sql               # Demo data
├── drizzle.config.ts      # Drizzle Kit configuration
└── package.json
```

**Key Tables:**

- `skills` - Skill metadata
- `skillVersions` - Version history
- `tags` - Categorization
- `skillTags` - Many-to-many relationship
- `users` - User profiles
- `reviews` - User reviews and ratings
- `downloads` - Download tracking

## 🔑 Key Concepts

### 1. Skill Manifest (`skillz.yaml`)

Every skill project has a `skillz.yaml` file:

```yaml
name: my-skill
version: 1.0.0
description: "My awesome skill"
author: username
mcp_version: "1.0"

dependencies:
  data-analyzer: ^2.0.0
  code-reviewer: 1.5.2

dev_dependencies:
  test-helper: ^1.0.0

mise:
  python: "3.11"
  uv: latest
```

**Parsed by:** `cli/internal/parser/parser.go`  
**Type definition:** `cli/internal/config/types.go`

### 2. Lock File (`skillz.lock`)

Generated during `skillz install`:

```yaml
version: 1
dependencies:
  data-analyzer:
    version: 2.1.0
    resolved: registry
    integrity: sha256-abc123...
    tarball_url: https://...
```

**Generated by:** `cli/internal/lockfile/lockfile.go`  
**Purpose:** Ensure reproducible installations

### 3. Dependency Resolution

**Entry point:** `cli/internal/resolver/resolver.go`

**Sources supported:**

- **Registry** - `data-analyzer` or `data-analyzer@1.0.0`
- **Git** - `github.com/user/repo` or `github.com/user/repo#branch`
- **Local** - `./local-skill` or `file:../local-skill`

**Resolution strategy:**

1. Parse dependency specifier
2. Determine source (registry, git, or local)
3. Fetch metadata/tags
4. Resolve version based on semver
5. Return `ResolvedPackage` with exact version and download URL

### 4. Installation Flow

**Entry point:** `cli/internal/installer/installer.go`

1. **EnsureDirectories** - Create `.skillz/skills/` and `.skillz/cache/`
2. **Download** - Fetch tarball to cache
3. **Verify** - Check SHA256 checksum
4. **Extract** - Unpack to `.skillz/skills/<name>/`
5. **Git clone** (if git dependency) - Clone to cache, copy to install dir

## 🧪 Testing Conventions

### Go Tests

```bash
cd cli
go test ./...                    # Run all tests
go test ./internal/installer -v  # Run specific package with verbose output
```

**Patterns:**

- Use `t.TempDir()` for temporary directories
- Co-locate tests with implementation
- Test file naming: `*_test.go`
- Test function naming: `TestFunctionName(t *testing.T)`

### TypeScript Tests

```bash
cd apps/api
pnpm test                        # Run Vitest tests
```

**Patterns:**

- Use Vitest for testing
- Mock Cloudflare bindings in tests
- Test file naming: `*.test.ts`

## 🔧 Common Tasks

### Adding a New CLI Command

1. **Create command file** in `cli/cmd/skillz/`
2. **Define Cobra command:**
   ```go
   var newCmd = &cobra.Command{
       Use:   "new",
       Short: "Description",
       Run: func(cmd *cobra.Command, args []string) {
           // Implementation
       },
   }
   ```
3. **Add to root command** in `main.go`:
   ```go
   rootCmd.AddCommand(newCmd)
   ```
4. **Write tests** in same directory

### Adding a New API Endpoint

1. **Define route** in `apps/api/src/index.ts`:
   ```typescript
   app.get("/api/v1/new-endpoint", async (c) => {
     const db = drizzle(c.env.DB);
     // Query database
     return c.json(results);
   });
   ```
2. **Add types** to `packages/shared/src/index.ts` if needed
3. **Write tests** in `index.test.ts`

### Modifying Database Schema

1. **Edit** `packages/db/src/schema.ts`:
   ```typescript
   export const newTable = sqliteTable("new_table", {
     id: integer("id").primaryKey(),
     name: text("name").notNull(),
   });
   ```
2. **Generate migration:**
   ```bash
   cd packages/db
   pnpm drizzle-kit generate
   ```
3. **Apply migration:**
   ```bash
   cd ../../apps/api
   wrangler d1 execute skillz-registry --local --file=../../packages/db/migrations/<new>.sql
   ```

### Adding a New Web Page

1. **Define route** in `apps/web/src/index.tsx`:
   ```typescript
   app.get('/new-page', async (c) => {
       return c.html(
           <Layout>
               <h1>New Page</h1>
           </Layout>
       );
   });
   ```
2. **Use inline CSS** for styling (see `DESIGN.md` for design tokens)

## 📋 Code Style Guidelines

### Go

- **Formatting:** Use `gofmt` (automatically applied)
- **Naming:**
  - Exported: `PascalCase` (e.g., `NewInstaller`)
  - Unexported: `camelCase` (e.g., `downloadFile`)
- **Error handling:** Always check and return errors
- **Comments:** Document all exported functions

### TypeScript

- **Formatting:** Prettier (if configured) or consistent spacing
- **Naming:**
  - Types/Interfaces: `PascalCase` (e.g., `Skill`, `SkillVersion`)
  - Variables/Functions: `camelCase`
- **Imports:** Use named imports from `@skillz/*` packages
- **Async:** Use `async/await`, avoid `.then()` chains

## 🚨 Common Gotchas

### CLI (Go)

1. **Import paths** - Use full paths: `github.com/tnfssc/skillz/cli/internal/installer`
2. **YAML tags** - Must match field names: `` `yaml:"name"` ``
3. **File paths** - Use `filepath.Join()` for cross-platform compatibility
4. **Testing** - Tests in package `foo` should use `package foo`, not `package foo_test` unless testing public API only

### API (TypeScript)

1. **Bindings** - Access via `c.env.DB`, `c.env.BUCKET` (not global variables)
2. **Drizzle** - Must create client per request: `const db = drizzle(c.env.DB)`
3. **Return types** - Use `c.json()`, `c.text()`, or `c.html()` for responses
4. **D1 limitations** - No joins in some cases, limited to 25MB database

### Database

1. **Migrations** - Always generate, never edit schema and migrations separately
2. **Primary keys** - Use `integer('id').primaryKey()` for auto-increment
3. **Relations** - Define in schema for Drizzle query builder
4. **Seeding** - Use raw SQL in `seed.sql`, not Drizzle (for simplicity)

## 🔍 Debugging Tips

### CLI

```bash
# Run with GODEBUG
GODEBUG=gctrace=1 ./dist/skillz install

# Print detailed errors
go run cmd/skillz/main.go install -v

# Use delve debugger
dlv debug cmd/skillz/main.go -- install
```

### API

```bash
# Local development with logs
cd apps/api
pnpm dev

# Check wrangler logs
wrangler tail

# Remote logs (production)
wrangler tail --remote
```

### Database

```bash
# Query local D1
wrangler d1 execute skillz-registry --local --command="SELECT * FROM skills"

# Query remote D1
wrangler d1 execute skillz-registry --remote --command="SELECT * FROM skills"

# Export data
wrangler d1 export skillz-registry --local --output=dump.sql
```

## 📚 Reference Documentation

- **Hono:** https://hono.dev/
- **Drizzle ORM:** https://orm.drizzle.team/
- **Cobra (Go CLI):** https://cobra.dev/
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Cloudflare D1:** https://developers.cloudflare.com/d1/
- **Cloudflare R2:** https://developers.cloudflare.com/r2/

## 🎯 Decision Making Guide

When working on this codebase:

1. **CLI changes** - Prioritize user experience and clear error messages
2. **API changes** - Keep responses consistent, use proper HTTP status codes
3. **Database changes** - Consider migration path and backward compatibility
4. **Dependencies** - Minimize external dependencies, prefer standard library
5. **Performance** - Edge-first architecture, minimize round trips to D1
6. **Security** - Validate all inputs, sanitize user data, use checksums for packages

## 🚀 Quick Command Reference

```bash
# CLI Development
cd cli && go test ./...
cd cli && go build -o ../dist/skillz ./cmd/skillz

# API Development
cd apps/api && pnpm dev
cd apps/api && pnpm test
cd apps/api && pnpm deploy

# Web Development
cd apps/web && pnpm dev
cd apps/web && pnpm deploy

# Database
cd packages/db && pnpm drizzle-kit generate
wrangler d1 execute skillz-registry --local --file=<migration>

# Workspace
pnpm install                    # Install all dependencies
pnpm build:cli                  # Build CLI (if script exists)
```

## 💡 Tips for Contributing

1. **Understand the flow** - CLI → API → D1/R2
2. **Check existing patterns** - Look at similar code before implementing
3. **Test thoroughly** - Write tests for new functionality
4. **Document decisions** - Add comments for non-obvious logic
5. **Keep it simple** - Prefer clarity over cleverness
6. **Edge-native mindset** - Think about global distribution, cold starts

---

**Happy coding!** If you need clarification on any part of the codebase, check the relevant source files or documentation linked above.
