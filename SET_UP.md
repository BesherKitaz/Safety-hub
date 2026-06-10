# SafetyHub Development Setup Guide

## Overview

SafetyHub is a containerized full-stack application consisting of:

- **Frontend:** React + Vite
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Containerization:** Docker Compose

All services run inside Docker containers and communicate through Docker's internal network.

---

# Project Structure

```text
Safety-hub/
├── .env
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── Dockerfile
│   └── prisma.config.ts
├── frontend/
│   ├── src/
│   └── Dockerfile
└── README.md
```

---

# Prerequisites

Install:

- Docker
- Docker Compose
- WSL (Windows users)

Verify installation:

```bash
docker --version
docker compose version
```

---

# Environment Configuration

Create a `.env` file in the project root.

```env
POSTGRES_USER=safetyhub         // Development Database
POSTGRES_PASSWORD=safetyhub     // Development Database
POSTGRES_DB=safetyhub           // Development Database

POSTGRES_PORT=5432
BACKEND_PORT=3001
FRONTEND_PORT=3000

DATABASE_URL=postgresql://safetyhub:safetyhub@db:5432/safetyhub
```

## Why use `db:5432` instead of `localhost`?

Inside Docker:

- `db` is the PostgreSQL container name.
- Containers communicate using container names.
- `5432` is PostgreSQL's internal port.

Therefore:

```text
backend ---> db:5432
```

works correctly.

---

# First-Time Setup

## Build Containers

From the project root:

```bash
docker compose up --build
```

### What this does

- Builds frontend image
- Builds backend image
- Pulls PostgreSQL image
- Creates containers
- Starts all services

---

# Running the Application

Start all services:

```bash
docker compose up
```

Start in background:

```bash
docker compose up -d
```

## View Running Containers

```bash
docker ps
```

Expected containers:

```text
safetyhub-db
safetyhub-backend
safetyhub-frontend
```

---

# Stopping the Application

Stop containers:

```bash
docker compose down
```

### What this does

- Stops all containers
- Removes containers
- Preserves database volume

Your data remains intact.

---

# Resetting the Database

Sometimes PostgreSQL credentials or schema become corrupted during development.

Reset everything:

```bash
docker compose down -v
```

Then:

```bash
docker compose up --build
```

### Warning

The `-v` flag removes volumes.

This permanently deletes:

- Database tables
- Database records
- Migration history stored in the database

Only use during development.

---

# Prisma Workflow

## Create a Migration

After modifying `schema.prisma`:

```bash
docker compose exec backend npx prisma migrate dev
```

### What this does

1. Compares schema changes.
2. Generates SQL migration files.
3. Applies migrations.
4. Regenerates Prisma Client.

---

## Regenerate Prisma Client

If types become outdated:

```bash
docker compose exec backend npx prisma generate
```

### What this does

Regenerates TypeScript Prisma types.

---

## Open Prisma Studio

```bash
docker compose exec backend npx prisma studio --browser none --port 5555
```

Prisma Studio provides a GUI for viewing and editing database records.

---

# Useful Debugging Commands

## Check Backend Environment Variables

```bash
docker compose exec backend printenv DATABASE_URL
```

Expected:

```text
postgresql://safetyhub:safetyhub@db:5432/safetyhub
```

---

## Check PostgreSQL Logs

```bash
docker compose logs db
```

Useful for:

- Authentication failures
- Startup issues
- Database crashes

---

## Check Backend Logs

```bash
docker compose logs backend
```

---

## Follow Logs Live

```bash
docker compose logs -f backend
```

Press:

```text
Ctrl + C
```

to stop viewing logs.

---

# Accessing Containers

Open a shell inside the backend container:

```bash
docker compose exec backend sh
```

Open a shell inside PostgreSQL:

```bash
docker compose exec db sh
```

---

# Connecting to PostgreSQL

Open psql:

```bash
docker compose exec db psql -U safetyhub -d safetyhub
```

Example:

```sql
SELECT * FROM "User";
```

Exit:

```sql
\q
```
---


# Common Issues

## Error: Can't reach database server

Example:

```text
P1001: Can't reach database server
```

Possible causes:

- Database container not running
- Incorrect hostname
- Wrong port

Verify:

```bash
docker ps
```

The database container should be running.

---

## Error: Authentication Failed

Example:

```text
P1000: Authentication failed
```

Usually caused by:

- Incorrect username/password
- Old PostgreSQL volume retaining previous credentials

Fix:

```bash
docker compose down -v
docker compose up --build
```

---

## Error: Container Name Already Exists

Example:

```text
Conflict. The container name is already in use.
```

Remove the conflicting container:

```bash
docker rm -f container-name
```

or:

```bash
docker compose down
```

---

# Daily Development Workflow

Start project:

```bash
docker compose up -d
```

Check logs if needed:

```bash
docker compose logs -f backend
```

Modify code.

If Prisma schema changes:

```bash
docker compose exec backend npx prisma migrate dev
```

When finished:

```bash
docker compose down
```

---

# Important Docker Networking Notes

Inside containers:

```text
db:5432
```

Outside containers (WSL/host machine):

```text
localhost:5433
```

Remember:

- Container → Container = use container name (`db`)
- Host → Container = use exposed port (`localhost:5433`)

This distinction prevents most Docker database connection issues.