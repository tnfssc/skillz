# Contributing to Skillz

We love your input! We want to make contributing to Skillz as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Development Setup

### Prerequisites

- Go 1.21+
- Node.js 20+
- pnpm

### Setting up the Monorepo

1.  Clone the repository:

    ```bash
    git clone https://github.com/tnfssc/skillz.git
    cd skillz
    ```

2.  Install API dependencies:

    ```bash
    cd apps/api
    pnpm install
    ```

3.  Start the local API (required for CLI tests):
    ```bash
    pnpm run dev
    ```

### Working on the CLI

1.  Navigate to the CLI directory:

    ```bash
    cd cli
    ```

2.  Run tests:

    ```bash
    go test ./...
    ```

3.  Build the binary:
    ```bash
    go build -o ../dist/skillz ./cmd/skillz
    ```

## Pull Request Process

1.  Fork the repo and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  Ensure the test suite passes.
4.  Make sure your code lints.
5.  Issue that pull request!

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
