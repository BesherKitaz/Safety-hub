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
│   └── src/
│   
├── scripts/
│    ├── database-migrate.sh
│    ├── database-reset.sh
│    ├──set-up.sh
│    │
│    └── ...
│
├──README.md
├──.env
├──.env.docker
├──docker.compose.yaml
└── Dockerfile
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
Create a `.env.docker` file in the project root.


```env
POSTGRES_USER=safetyhub         // Development Database
POSTGRES_PASSWORD=safetyhub     // Development Database
POSTGRES_DB=safetyhub           // Development Database

POSTGRES_PORT=5432
BACKEND_PORT=3001
FRONTEND_PORT=3000

```

```env.docker
DATABASE_URL="postgresql://safetyhub:safetyhub@db:5432/safetyhub"

```

## Why use `db:5432` instead of `localhost` in docker?

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

- Builds Workflow image
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
safetyhub-workflow
```

---
# Setup development enviroment, run containers and install dependencies

Run this regularly when you start development

```bash
./scripts/set-up.sh
```


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
./scripts/database-reset.sh
```

### Warning

This script removes volumes and therefore erases all data in the database. Do NOT run this in production.

This permanently deletes:

- Database tables
- Database records
- Migration history stored in the database

Only use during development.

---

# Prisma Workflow

## Create a Migration & generate a new client

After modifying `schema.prisma`:


```bash
./scripts/database-migrate.sh
```

### What this does

Reflects changes made to schema on the database and regenerates TypeScript Prisma types.

---

## Open Prisma Studio

```bash
cd backend && npx prisma studio --browser none --port 5555
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

Open a shell inside the workflow container:

```bash
docker compose exec workflow sh
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

### Start project:

```bash
./scripts/set-up.sh
```

or 

```bash
npm run set-up
```

### Run Development Server

Run both backend and frontend server concurrently


From project root:

```bash
npm run dev
```

### If Prisma schema changes:

```bash
./scripts/database-migrate.sh
```

or 

```bash
npm run db-migrate
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