#!/bin/bash

# Skillz CLI Demo
# This script demonstrates the working features of the skillz package manager

set -e

echo "🚀 Skillz Package Manager Demo"
echo "================================"
echo ""

# Setup
DEMO_DIR="/tmp/skillz-demo-$(date +%s)"
mkdir -p "$DEMO_DIR"
cd "$DEMO_DIR"

SKILLZ="/home/tnfssc/Code/Private/skillz.lat/dist/skillz"

echo "📁 Demo directory: $DEMO_DIR"
echo ""

# Test 1: Initialize a new project
echo "✨ Test 1: Initialize a new skill project"
echo "-------------------------------------------"
echo -e "my-awesome-skill\n1.0.0\nAn awesome Claude skill\nDemo User\nSKILL.md" | $SKILLZ init
echo ""

# Show created files
echo "📄 Created files:"
ls -la
echo ""

echo "📄 skillz.yaml contents:"
cat skillz.yaml
echo ""

# Test 2: Add a registry dependency
echo "📦 Test 2: Add a dependency from registry"
echo "-------------------------------------------"
$SKILLZ add data-analyzer
echo ""

# Test 3: Add a git dependency
echo "📦 Test 3: Add a git dependency"
echo "-------------------------------------------"
$SKILLZ add https://github.com/example/helper-skill --dev
echo ""

# Show updated manifest
echo "📄 Updated skillz.yaml:"
cat skillz.yaml
echo ""

# Test 4: List dependencies
echo "📋 Test 4: List dependencies"
echo "-------------------------------------------"
$SKILLZ list
echo ""

# Test 5: Install dependencies
echo "📥 Test 5: Install dependencies"
echo "-------------------------------------------"
$SKILLZ install
echo ""

# Test 6: Remove a dependency
echo "🗑️  Test 6: Remove a dependency"
echo "-------------------------------------------"
$SKILLZ remove data-analyzer
echo ""

# Final list
echo "📋 Final dependency list"
echo "-------------------------------------------"
$SKILLZ list
echo ""

# Test 7: Show version and help
echo "ℹ️  Test 7: Version and help"
echo "-------------------------------------------"
$SKILLZ --version
echo ""
$SKILLZ --help
echo ""

echo "✅ Demo complete!"
echo ""
echo "🧹 Cleanup: rm -rf $DEMO_DIR"
