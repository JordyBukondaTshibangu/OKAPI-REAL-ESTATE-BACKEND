# Backend Setup Instructions

A step-by-step record of how the `okapi-real-estate-backend` was set up and started locally.

---

## Prerequisites

- [Node.js](https://nodejs.org) v22+
- [pnpm](https://pnpm.io) package manager
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (used to run PostgreSQL)
- [Visual Studio Code](https://code.visualstudio.com)
- [Postman](https://www.postman.com)

---

## Step 1 — Open the project in VS Code

```bash
open -a "Visual Studio Code" ~/Desktop/"REAL ESTATE PROJECT"/okapi-real-estate-backend
```

---

## Step 2 — Start Docker Desktop

The project uses Docker to run PostgreSQL. Launch Docker Desktop from your Applications folder (or via Spotlight), then wait until the Docker daemon is fully ready before proceeding.

---

## Step 3 — Start the PostgreSQL container

The `.env` file expects a PostgreSQL server at `localhost:5432` with the following credentials:

| Key      | Value              |
|----------|--------------------|
| User     | `postgres`         |
| Password | `postgres`         |
| Database | `okapi_real_estate`|
| Port     | `5432`             |

Run this command to spin up a matching PostgreSQL container:

```bash
docker run -d \
  --name okapi-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=okapi_real_estate \
  -p 5432:5432 \
  postgres:16-alpine
```

Verify it is ready:

```bash
docker exec okapi-postgres pg_isready -U postgres
```

You should see: `/var/run/postgresql:5432 - accepting connections`

> **Next time:** If the container already exists (e.g. after a restart), start it with:
> ```bash
> docker start okapi-postgres
> ```

---

## Step 4 — Push the Prisma schema to the database

There are no migration files in this project, so use `db push` to create the tables directly from `prisma/schema.prisma`:

```bash
cd ~/Desktop/"REAL ESTATE PROJECT"/okapi-real-estate-backend
pnpm exec prisma db push
```

You should see: `Your database is now in sync with your Prisma schema.`

> You only need to run this once (or again whenever the schema changes).

---

## Step 5 — Start the NestJS backend

Run the backend in watch mode (auto-reloads on file changes):

```bash
pnpm run start:dev
```

Wait until you see:

```
[NestApplication] Nest application successfully started
```

The server will be running at **http://localhost:3000**.

---

## Step 6 — Open Postman

Launch Postman from your Applications folder. Set the base URL in your requests to:

```
http://localhost:3000
```

---

## Available API Routes

| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| GET    | /properties        | List all properties  |
| GET    | /properties/:id    | Get one property     |
| POST   | /properties        | Create a property    |
| PATCH  | /properties/:id    | Update a property    |
| DELETE | /properties/:id    | Delete a property    |
| GET    | /agents            | List all agents      |
| GET    | /agents/:id        | Get one agent        |
| POST   | /agents            | Create an agent      |
| PATCH  | /agents/:id        | Update an agent      |
| DELETE | /agents/:id        | Delete an agent      |
| GET    | /agencies          | List all agencies    |
| GET    | /agencies/:id      | Get one agency       |
| POST   | /agencies          | Create an agency     |
| PATCH  | /agencies/:id      | Update an agency     |
| DELETE | /agencies/:id      | Delete an agency     |

---

## Environment Variables (`.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/okapi_real_estate?schema=public"
JWT_SECRET="okapi-super-secret-jwt-key-2024"
PORT=3000
```

---

## Quick-start Checklist (for future sessions)

- [ ] Start Docker Desktop
- [ ] Run `docker start okapi-postgres`
- [ ] Run `pnpm run start:dev` inside the project folder
- [ ] Open Postman and set base URL to `http://localhost:3000`
