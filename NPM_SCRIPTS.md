# Helpful NPM Scripts As Shortcuts

### From project root:

Start Development Server for Backend and Frontend Concurrently

```bash
npm run dev
```

Open PostgreSQL Shell

```bash
npm run db-shell
```

Reset Database

```bash
npm run db-reset
```

Runs:

Use this when the local DEVELOPMENT database needs to be wiped and recreated.

> WARNING: this may delete existing local database data depending on what the script does.


Open Prisma Studio

```bash
npm run db-migrate
```
> If using Docker, you may need to expose the Prisma Studio port and run it from inside the backend container instead.

Perform Prisma Migrations

```bash
npm db-migrate
```

Set up Containers

```bash
npm run dev:docker
```