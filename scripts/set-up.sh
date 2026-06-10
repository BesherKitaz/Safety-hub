#!/usr/bin/env bash

set -e

echo "Starting SafetyHub daily development environment..."

#!/usr/bin/env bash

echo "Checking Docker..."
docker --version || exit 1

echo "Starting database..."
docker compose up -d db

echo "Installing backend dependencies..."
cd backend
npm install

echo "Installing frontend dependencies..."
cd ../frontend
npm install

npm install
echo "Done."
docker compose exec workspace bash


echo "Database Container is running."
echo "Useful commands:"
echo "  docker compose logs -f backend"
echo "  docker compose logs -f frontend"
echo "  docker compose exec backend npx prisma migrate dev"
echo "  docker compose down"