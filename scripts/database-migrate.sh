#!/usr/bin/env bash

set -e

echo "Running Prisma migration without deleting database contents..."

docker compose up -d db workspace
docker compose exec workspace sh -lc "cd backend && npx prisma migrate dev"
docker compose exec workspace sh -lc "cd backend && npx prisma generate"


echo "Migration completed successfully."