#!/bin/bash

echo "===================================="
echo -e "\e[33mWARNING: This will DELETE ALL DATA\e[0m"
echo -e "\e[31mDO NOT RUN IN PRODUCTION UNLESS YOU KNOW WHAT YOU ARE DOING\e[0m"
echo "===================================="

read -p "Continue? (y/N): " confirm

if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 1
fi

docker compose down -v
docker compose up -d db

cd backend
npx prisma migrate dev

echo "Database reset complete."

