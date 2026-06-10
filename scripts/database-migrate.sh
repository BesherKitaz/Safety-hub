\# scripts/database-migrate.sh

#!/usr/bin/env bash

set -e

echo "Running Prisma migration without deleting database contents..."

docker compose exec backend npx prisma migrate dev

echo "Migration completed successfully."
