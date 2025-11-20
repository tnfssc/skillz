# Skillz CLI

The command-line interface for the Skillz package manager.

## Prerequisites

- [mise](https://mise.jdx.dev) (recommended) or Go 1.21+

## Installation

### From Source

```bash
git clone https://github.com/tnfssc/skillz.git
cd skillz/cli
go install ./cmd/skillz
```

## Configuration

The CLI can be configured via environment variables:

| Variable              | Description                    | Default                        |
| --------------------- | ------------------------------ | ------------------------------ |
| `SKILLZ_REGISTRY_URL` | URL of the Skillz registry API | `http://localhost:8787/api/v1` |

## Usage

### `skillz init`

Initialize a new Skillz project in the current directory. Creates a `skillz.toon` manifest.

```bash
skillz init
```

### `skillz install`

Install dependencies defined in `skillz.toon`.

- Downloads packages from the registry or Git.
- Verifies integrity (SHA256).
- Generates/Updates `skillz.lock`.
- Installs packages to `.skillz/skills/`.

```bash
skillz install
```

### `skillz login`

Authenticate with the registry. Saves credentials to `~/.skillz/credentials.json`.

```bash
skillz login -u <username> -p <password>
```

### `skillz publish`

Publish a package to the registry.

1.  Updates version in `skillz.toon` (optional).
2.  Creates a tarball of the current directory (respecting `.gitignore`).
3.  Uploads to the registry.

```bash
skillz publish
```

## Manifest Format (`skillz.toon`)

Skillz uses [TOON](https://github.com/tnfssc/goon) format for configuration.

```toon
name: my-agent
version: 1.0.0
manifest-version: 1

skill:
  main: agent.py

dependencies:
  skills:
    # Registry dependency
    browser-use: ^1.0.0

    # Git dependency
    git-helper:
      git: https://github.com/user/git-helper.git
      ref: develop
```

```

```
