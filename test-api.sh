#!/bin/bash

# Test script for Skillz API

echo "🧪 Testing Skillz API"
echo "===================="
echo ""

BASE_URL="http://localhost:8787/api/v1"

echo "1️⃣ Health Check"
echo "==============="
curl -s http://localhost:8787/ | jq .
echo ""

echo "2️⃣ List All Skills"
echo "=================="
curl -s "$BASE_URL/skills" | jq '.skills[] | {name, author, downloads: 0}'
echo ""

echo "3️⃣ Search for 'code'"
echo "===================="
curl -s "$BASE_URL/search?q=code" | jq '.results[] | {name, description}'
echo ""

echo "4️⃣ Get Skill Details: data-analyzer"
echo "==================================="
curl -s "$BASE_URL/skills/data-analyzer" | jq '{name: .name, author: .author, versions: (.versions | length)}'
echo ""

echo "5️⃣ Registry Stats"
echo "================="
curl -s "$BASE_URL/stats" | jq .
echo ""

echo "✅ API Tests Complete!"
