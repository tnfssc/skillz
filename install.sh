#!/bin/sh
set -e

# Skillz Installer
# Installs the latest version of skillz CLI

REPO="tnfssc/skillz"
BINARY="skillz"
INSTALL_DIR="/usr/local/bin"

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux)  OS="linux" ;;
    Darwin) OS="darwin" ;;
    *)      echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Detect Arch
ARCH="$(uname -m)"
case "$ARCH" in
    x86_64) ARCH="amd64" ;;
    arm64)  ARCH="arm64" ;;
    aarch64) ARCH="arm64" ;;
    *)      echo "Unsupported Architecture: $ARCH"; exit 1 ;;
esac

echo "Installing skillz for $OS/$ARCH..."

# Get latest release tag
LATEST_TAG=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_TAG" ]; then
    echo "Failed to fetch latest release version."
    exit 1
fi

echo "Latest version: $LATEST_TAG"

# Construct download URL
# Format: skillz_Linux_x86_64.tar.gz
# GoReleaser format: {{ .ProjectName }}_{{ title .Os }}_{{ .Arch }}
OS_TITLE="$(echo "$OS" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')"
if [ "$ARCH" = "amd64" ]; then
    ARCH_TITLE="x86_64"
else
    ARCH_TITLE="$ARCH"
fi

FILENAME="${BINARY}_${OS_TITLE}_${ARCH_TITLE}.tar.gz"
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_TAG/$FILENAME"

echo "Downloading from $DOWNLOAD_URL..."

TMP_DIR=$(mktemp -d)
curl -fsSL "$DOWNLOAD_URL" -o "$TMP_DIR/$FILENAME"

echo "Extracting..."
tar -xzf "$TMP_DIR/$FILENAME" -C "$TMP_DIR"

echo "Installing to $INSTALL_DIR..."
if [ -w "$INSTALL_DIR" ]; then
    mv "$TMP_DIR/$BINARY" "$INSTALL_DIR/$BINARY"
else
    sudo mv "$TMP_DIR/$BINARY" "$INSTALL_DIR/$BINARY"
fi

chmod +x "$INSTALL_DIR/$BINARY"
rm -rf "$TMP_DIR"

echo "✅ Skillz installed successfully!"
echo "Run 'skillz --help' to get started."
