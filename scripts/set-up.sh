#!/usr/bin/env bash

set -e

echo "Checking Docker..."
docker --version || exit 1

echo "Starting database and workspace..."
docker compose up -d db workspace

echo "Installing backend dependencies inside workspace..."
docker compose exec workspace sh -lc "cd backend && npm install"

echo "Installing frontend dependencies inside workspace..."
docker compose exec workspace sh -lc "cd frontend && npm install"

echo "Installing root dependencies inside workspace..."
docker compose exec workspace sh -lc "npm install"

echo "Generating Prisma client..."
docker compose exec workspace sh -lc "cd backend && npx prisma generate"

echo "Done."
echo ""
echo "Database Container is running."
echo "Useful commands:"
echo "  docker compose logs -f backend"
echo "  docker compose logs -f frontend"
echo "  docker compose exec backend npx prisma migrate dev"
echo "  docker compose down"