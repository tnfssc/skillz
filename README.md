# Skillz 🤹

> **The "npm" for AI Skills and MCP Servers**

Skillz is a package manager and registry designed to make it easy to discover, install, and manage AI skills and Model Context Protocol (MCP) servers. Just as npm revolutionized JavaScript development, Skillz aims to streamline the ecosystem of AI capabilities.

## 🛠️ Prerequisites

- [mise](https://mise.jdx.dev) (for managing tool versions)

```bash
# Install tools
mise install
```

## 🌟 Features

- **📦 Dependency Management:** Declare skills and MCP servers in a `skillz.toon` manifest.
- **🔒 Lockfile Support:** Reproducible installs with `skillz.lock`.
- **⚡ Fast & Efficient:** Written in Go for performance.
- **🛡️ Integrity Checking:** SHA256 checksum verification for all packages.
- **🐙 Git Integration:** Install dependencies directly from Git repositories.
- **📝 TOON Format:** Uses The Object-Oriented Notation (TOON) for human-readable configuration.

## 🚀 Quick Start

### Installation

```bash
# Install the CLI (Linux/macOS)
curl -fsSL https://skillz.lat/install.sh | sh

# Or build from source
go install github.com/tnfssc/skillz/cli/cmd/skillz@latest
```

### Creating a New Project

```bash
mkdir my-agent
cd my-agent
skillz init
```

### Installing Dependencies

Add dependencies to your `skillz.toon` file:

```toon
dependencies:
  skills:
    data-analysis: ^1.0.0
    git-helper:
      git: https://github.com/user/git-helper.git
      ref: develop
```

Then run:

```bash
skillz install
```

## 🏗️ Architecture

The Skillz ecosystem consists of three main components:

1.  **CLI (`/cli`):** The command-line tool for managing projects and dependencies.
2.  **Registry API (`/apps/api`):** The backend service hosting package metadata and tarballs.
3.  **Database (`/packages/db`):** SQLite database (D1) storing registry state.

## 📚 Documentation

- [CLI Documentation](cli/README.md) - Detailed usage guide for the `skillz` command.
- [API Documentation](apps/api/README.md) - API reference for the registry.
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to Skillz.

## 🔐 Security

### Reporting Vulnerabilities

If you discover a security vulnerability within Skillz, please send an email to **security@skillz.lat**. All security vulnerabilities will be promptly addressed.

### Verifying Binaries

All official CLI releases are signed. You can verify the integrity of the downloaded binary using the `SHA256SUMS` file attached to each release:

```bash
# Download binary and checksums
curl -LO https://github.com/tnfssc/skillz/releases/download/v1.0.0/skillz-linux-amd64
curl -LO https://github.com/tnfssc/skillz/releases/download/v1.0.0/SHA256SUMS

# Verify
sha256sum -c SHA256SUMS --ignore-missing
```

## 📄 License

MIT
