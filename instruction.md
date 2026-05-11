# Okapi Real Estate Backend — Developer Guide

This document covers everything you need to understand, set up, run, and work with the Okapi Real Estate Backend. Whether you are picking up the project for the first time or returning after a break, start here.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Architecture](#3-project-architecture)
4. [Prerequisites](#4-prerequisites)
5. [First-Time Setup](#5-first-time-setup)
6. [Running the Project](#6-running-the-project)
7. [Stopping the Project](#7-stopping-the-project)
8. [Environment Variables](#8-environment-variables)
9. [Database](#9-database)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [API Reference](#11-api-reference)
12. [Quick-Start Checklist](#12-quick-start-checklist)

---

## 1. Project Overview

Okapi Real Estate Backend is a REST API that powers a real estate listing platform. It manages three core entities — **properties**, **agencies**, and **agents** — and exposes endpoints for browsing, filtering, searching, and sorting them.

The backend also handles user registration and login, as well as a separate admin authentication system. Admin users can create, update, and delete data; regular users can browse listings and manage their own profile.

**Key capabilities:**
- Full CRUD for properties, agencies, and agents (admin only for write operations)
- Filtering, searching, sorting, and pagination on all list endpoints
- JWT-based authentication for both users and admins
- Rate limiting (100 requests per minute per IP)
- Input validation on all request bodies and query parameters
- Swagger UI for interactive API documentation

---

## 2. Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Runtime        | Node.js v22+                            |
| Framework      | NestJS (TypeScript)                     |
| Database       | PostgreSQL 16 (via Docker)              |
| ORM            | Prisma                                  |
| Auth           | JWT (JSON Web Tokens) via Passport.js   |
| Validation     | class-validator + class-transformer     |
| Rate Limiting  | @nestjs/throttler                       |
| API Docs       | Swagger (OpenAPI)                       |
| Package Manager| pnpm                                    |

---

## 3. Project Architecture

The project follows NestJS's standard module-based architecture. Each feature lives in its own module folder and contains a controller, a service, and DTOs.

```
src/
├── auth/                     # Authentication module
│   ├── user/                 # User register & login
│   ├── admin/                # Admin login
│   ├── guards/               # JWT guards (user & admin)
│   └── strategies/           # Passport JWT strategies
│
├── users/                    # Authenticated user profile management
│
├── properties/               # Property listings
│   └── dto/                  # Filter, create, update DTOs
│
├── agencies/                 # Real estate agencies
│   └── dto/
│
├── agents/                   # Real estate agents
│   └── dto/
│
├── common/
│   └── dto/
│       └── pagination.dto.ts # Shared page/limit params
│
├── prisma/                   # Prisma client wrapper
│
├── app.module.ts             # Root module (registers all modules + throttler)
└── main.ts                   # App entry point (Swagger, validation, CORS)
```

### How the modules relate

```
Agency  ──< Agent  ──< Property
```

- An **Agency** has many **Agents**.
- An **Agent** belongs to one **Agency** and has many **Properties**.
- A **Property** belongs to both an **Agent** and an **Agency**.

---

## 4. Prerequisites

Install these tools before doing anything else.

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org) | v22+ | JavaScript runtime |
| [pnpm](https://pnpm.io) | latest | Package manager (`npm install -g pnpm`) |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | latest | Runs the PostgreSQL database |
| [Git](https://git-scm.com) | latest | Version control |
| [Postman](https://www.postman.com) *(optional)* | latest | Testing API requests |

---

## 5. First-Time Setup

Follow these steps once when cloning the project for the first time.

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd okapi-real-estate-backend
```

### Step 2 — Install dependencies

```bash
pnpm install
```

### Step 3 — Create the environment file

Create a `.env` file at the root of the project:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/okapi_real_estate?schema=public"
JWT_SECRET="okapi-super-secret-jwt-key-2024"
PORT=3000
```

See [Chapter 8 — Environment Variables](#8-environment-variables) for a full description of each variable.

### Step 4 — Start Docker Desktop

Open Docker Desktop and wait for the whale icon in the menu bar to stop animating. The Docker daemon must be fully ready before you start any container.

### Step 5 — Start the PostgreSQL container

The project includes a `docker-compose.yml` that runs PostgreSQL 16.

**First time (or after `docker compose down`):**

```bash
docker compose up -d
```

**All subsequent sessions:**

```bash
docker compose start
```

Verify the database is accepting connections:

```bash
docker compose exec postgres pg_isready -U postgres
```

Expected output: `/var/run/postgresql:5432 - accepting connections`

### Step 6 — Apply the database schema

Push the Prisma schema to create all tables in the database:

```bash
pnpm exec prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

> Re-run this command any time `prisma/schema.prisma` changes.

### Step 7 — Seed the database (optional)

Populate the database with sample data:

```bash
pnpm exec prisma db seed
```

### Step 8 — Start the server

```bash
pnpm run start:dev
```

The server runs in watch mode and reloads automatically when you change a file. Wait for:

```
[NestApplication] Nest application successfully started
```

The API is now available at **http://localhost:3000**.
The interactive Swagger UI is available at **http://localhost:3000/api**.

---

## 6. Running the Project

Every time you want to work on the project after the first-time setup:

**1. Start Docker Desktop** — open it from Applications and wait for the daemon to be ready.

**2. Start the database container:**

```bash
docker compose start
```

**3. Start the NestJS server:**

```bash
pnpm run start:dev
```

The API is ready at **http://localhost:3000**.

---

## 7. Stopping the Project

**Stop the NestJS server:** press `Ctrl + C` in the terminal running it.

**Stop the database container (keeps all data):**

```bash
docker compose stop
```

**Destroy the container and wipe all database data:**

```bash
docker compose down -v
```

> Use `docker compose down -v` only if you want a clean slate. All data will be lost and you will need to re-seed.

---

## 8. Environment Variables

The project reads these variables from the `.env` file at the root.

| Variable | Description | Example value |
|----------|-------------|---------------|
| `DATABASE_URL` | Full PostgreSQL connection string used by Prisma | `postgresql://postgres:postgres@localhost:5432/okapi_real_estate?schema=public` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens. Keep this private. | `okapi-super-secret-jwt-key-2024` |
| `PORT` | Port the NestJS server listens on | `3000` |

---

## 9. Database

### Technology

The project uses **PostgreSQL 16** running in Docker and accessed via **Prisma ORM**. There are no SQL migration files — the schema is pushed directly using `prisma db push`.

### Database credentials (Docker)

| Key      | Value               |
|----------|---------------------|
| Host     | `localhost`         |
| Port     | `5432`              |
| User     | `postgres`          |
| Password | `postgres`          |
| Database | `okapi_real_estate` |

### Data models

The schema lives at `prisma/schema.prisma`. Below is a description of each model.

---

#### `Admin`
Represents a back-office administrator. Admins can log in and receive a JWT that grants write access to all resources.

| Field         | Type     | Notes                    |
|---------------|----------|--------------------------|
| `id`          | String   | UUID, primary key        |
| `email`       | String   | Unique                   |
| `passwordHash`| String   | Bcrypt hash              |
| `createdAt`   | DateTime |                          |

---

#### `User`
Represents a registered end-user of the platform.

| Field         | Type   | Notes             |
|---------------|--------|-------------------|
| `id`          | String | UUID, primary key |
| `firstName`   | String |                   |
| `lastName`    | String |                   |
| `email`       | String | Unique            |
| `phoneNumber` | String |                   |
| `passwordHash`| String | Bcrypt hash       |
| `createdAt`   | DateTime |                 |

---

#### `Agency`
Represents a real estate agency. An agency has many agents and many properties.

| Field            | Type     | Notes                     |
|------------------|----------|---------------------------|
| `id`             | String   | UUID, primary key         |
| `name`           | String   |                           |
| `monogram`       | String   | Short display abbreviation|
| `accentClass`    | String   | UI color class            |
| `tagline`        | String   |                           |
| `description`    | String   |                           |
| `address`        | String   |                           |
| `phone`          | String   |                           |
| `email`          | String   |                           |
| `website`        | String?  | Optional                  |
| `founded`        | Int      | Year founded              |
| `agentCount`     | Int      | Denormalized count        |
| `listingCount`   | Int      | Denormalized count        |
| `closedDeals`    | Int      | Denormalized count        |
| `specializations`| String[] |                           |
| `areasServed`    | String[] |                           |
| `languages`      | String[] |                           |
| `certifications` | String[] |                           |

---

#### `Agent`
Represents a real estate agent. An agent belongs to one agency and has many properties.

| Field               | Type    | Notes                        |
|---------------------|---------|------------------------------|
| `id`                | String  | UUID, primary key            |
| `agencyId`          | String  | Foreign key → Agency         |
| `name`              | String  |                              |
| `title`             | String  | e.g. "Senior Property Advisor"|
| `specialization`    | String  |                              |
| `nationality`       | String  |                              |
| `languages`         | String[]|                              |
| `yearsExperience`   | Int     |                              |
| `experienceSince`   | Int     | Year                         |
| `rating`            | Float   | Average rating               |
| `ratingsCount`      | Int     | Number of ratings            |
| `responseMinutes`   | Int     | Avg response time in minutes |
| `brokerLicense`     | String  |                              |
| `forSaleCount`      | Int     |                              |
| `forRentCount`      | Int     |                              |
| `closedDeals`       | Int     |                              |
| `totalDealsValueUsd`| Float   |                              |
| `bio`               | String  |                              |
| `photo`             | String  | URL                          |

---

#### `Property`
Represents a real estate listing. A property belongs to both an agent and an agency.

| Field            | Type     | Notes                                         |
|------------------|----------|-----------------------------------------------|
| `id`             | String   | UUID, primary key                             |
| `agentId`        | String   | Foreign key → Agent                           |
| `agencyId`       | String   | Foreign key → Agency                          |
| `listingType`    | String   | e.g. `sale`, `rent`                           |
| `category`       | String   | e.g. `apartment`, `villa`, `office`           |
| `price`          | Float    |                                               |
| `currency`       | String   | e.g. `AED`, `USD`                             |
| `period`         | String?  | e.g. `monthly`, `yearly` (for rentals)        |
| `title`          | String   |                                               |
| `subtitle`       | String   |                                               |
| `bedrooms`       | Int      |                                               |
| `bathrooms`      | Int      |                                               |
| `areaSqm`        | Float    |                                               |
| `suburb`         | String   |                                               |
| `neighborhood`   | String   |                                               |
| `city`           | String   |                                               |
| `verified`       | Boolean  | Default: false                                |
| `premium`        | Boolean  | Default: false                                |
| `isNew`          | Boolean  | Default: false                                |
| `listedDaysAgo`  | Int      |                                               |
| `gallery`        | String[] | Array of image URLs                           |
| `amenities`      | String[] |                                               |
| `description`    | String?  |                                               |
| `createdAt`      | DateTime |                                               |

---

#### `AreaOfExpertise`
A sub-record attached to an agent describing their expertise in a specific area.

#### `TrackRecord`
A sub-record attached to an agent showing individual past deals.

---

## 10. Authentication & Authorization

### Overview

The API uses two separate JWT-based authentication systems:

| System | Who it's for | How to get a token |
|--------|--------------|--------------------|
| **User auth** | End-users of the platform | `POST /auth/register` then `POST /auth/login` |
| **Admin auth** | Back-office administrators | `POST /auth/admin/login` |

Both systems return a JWT token. Include the token as a `Bearer` header on protected requests:

```
Authorization: Bearer <your-token-here>
```

### User authentication

#### Register a new user

```
POST /auth/register
```

Request body:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phoneNumber": "+971501234567",
  "password": "secret123"
}
```

Response: the created user object (password is never returned).

#### Log in as a user

```
POST /auth/login
```

Request body:

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

Response: `{ "access_token": "<jwt>" }`

### Admin authentication

Admins are created directly in the database. There is no public registration endpoint for admins.

#### Log in as an admin

```
POST /auth/admin/login
```

Request body:

```json
{
  "email": "admin@okapi.com",
  "password": "adminpassword"
}
```

Response: `{ "access_token": "<jwt>" }`

### Protected routes

| Guard | Applied to | Token required |
|-------|-----------|----------------|
| `JwtUserGuard` | `GET /users/me`, `PATCH /users/me`, `DELETE /users/me` | User token |
| `JwtAdminGuard` | All `POST`, `PATCH`, `DELETE` on /properties, /agencies, /agents | Admin token |

Public routes (no token needed): all `GET` endpoints for properties, agencies, and agents, plus the auth endpoints themselves.

### Rate limiting

The API enforces a global rate limit of **100 requests per 60 seconds** per IP address. Exceeding this limit returns `429 Too Many Requests`.

---

## 11. API Reference

Base URL: `http://localhost:3000`

Interactive Swagger UI: `http://localhost:3000/api`

---

### 11.1 Auth — `/auth`

| Method | Endpoint             | Auth required | Description          |
|--------|----------------------|---------------|----------------------|
| POST   | `/auth/register`     | None          | Register a new user  |
| POST   | `/auth/login`        | None          | Log in as a user     |
| POST   | `/auth/admin/login`  | None          | Log in as an admin   |

---

### 11.2 Users — `/users`

All user endpoints require a valid **user JWT token**.

| Method | Endpoint      | Description                    |
|--------|---------------|--------------------------------|
| GET    | `/users/me`   | Get the authenticated user's profile |
| PATCH  | `/users/me`   | Update the authenticated user's profile |
| DELETE | `/users/me`   | Delete the authenticated user's account |

---

### 11.3 Properties — `/properties`

Write operations (`POST`, `PATCH`, `DELETE`) require an **admin JWT token**.
Read operations are public.

| Method | Endpoint            | Auth         | Description          |
|--------|---------------------|--------------|----------------------|
| GET    | `/properties`       | None         | List properties      |
| GET    | `/properties/:id`   | None         | Get one property     |
| POST   | `/properties`       | Admin token  | Create a property    |
| PATCH  | `/properties/:id`   | Admin token  | Update a property    |
| DELETE | `/properties/:id`   | Admin token  | Delete a property    |

#### Query parameters for `GET /properties`

Combine any of these parameters to filter, search, sort, and paginate results.

| Parameter     | Type    | Default | Description |
|---------------|---------|---------|-------------|
| `page`        | number  | `1`     | Page number |
| `limit`       | number  | `10`    | Results per page (max 100) |
| `search`      | string  | —       | Full-text search across `title`, `subtitle`, `description`, `city`, `suburb`, `neighborhood`, `category`, and `listingType` |
| `listingType` | string  | —       | Filter by listing type (e.g. `sale`, `rent`) |
| `category`    | string  | —       | Filter by category (e.g. `apartment`, `villa`) |
| `city`        | string  | —       | Filter by city (exact match) |
| `suburb`      | string  | —       | Filter by suburb (exact match) |
| `minPrice`    | number  | —       | Minimum price (inclusive) |
| `maxPrice`    | number  | —       | Maximum price (inclusive) |
| `bedrooms`    | number  | —       | Exact number of bedrooms |
| `bathrooms`   | number  | —       | Exact number of bathrooms |
| `minArea`     | number  | —       | Minimum area in sqm (inclusive) |
| `maxArea`     | number  | —       | Maximum area in sqm (inclusive) |
| `period`      | string  | —       | Rental period (e.g. `monthly`, `yearly`) |
| `verified`    | boolean | —       | `true` to show only verified listings |
| `premium`     | boolean | —       | `true` to show only premium listings |
| `sortBy`      | string  | —       | Sort field: `price` \| `title` \| `listingType` \| `category` |
| `sortOrder`   | string  | `asc`   | Sort direction: `asc` \| `desc` |

**Examples:**

```
# All apartments for sale in Dubai, sorted by price ascending
GET /properties?listingType=sale&category=apartment&city=Dubai&sortBy=price&sortOrder=asc

# Search for marina properties under 2,000,000
GET /properties?search=marina&maxPrice=2000000&sortBy=price

# Premium verified listings, page 2
GET /properties?premium=true&verified=true&page=2&limit=20
```

---

### 11.4 Agencies — `/agencies`

Write operations require an **admin JWT token**.
Read operations are public.

| Method | Endpoint          | Auth         | Description        |
|--------|-------------------|--------------|--------------------|
| GET    | `/agencies`       | None         | List agencies      |
| GET    | `/agencies/:id`   | None         | Get one agency     |
| POST   | `/agencies`       | Admin token  | Create an agency   |
| PATCH  | `/agencies/:id`   | Admin token  | Update an agency   |
| DELETE | `/agencies/:id`   | Admin token  | Delete an agency   |

#### Query parameters for `GET /agencies`

| Parameter   | Type   | Default | Description |
|-------------|--------|---------|-------------|
| `page`      | number | `1`     | Page number |
| `limit`     | number | `10`    | Results per page (max 100) |
| `search`    | string | —       | Full-text search across `name`, `tagline`, `description`, and `address` |
| `name`      | string | —       | Filter by name (partial match, case-insensitive) |
| `language`  | string | —       | Filter by a language the agency supports |
| `sortBy`    | string | —       | Sort field: `name` \| `agentCount` \| `listingCount` \| `founded` |
| `sortOrder` | string | `asc`   | Sort direction: `asc` \| `desc` |

**Examples:**

```
# Agencies with the most listings first
GET /agencies?sortBy=listingCount&sortOrder=desc

# Search for agencies that mention "luxury" in their name or description
GET /agencies?search=luxury

# Arabic-speaking agencies, sorted alphabetically
GET /agencies?language=Arabic&sortBy=name&sortOrder=asc
```

---

### 11.5 Agents — `/agents`

Write operations require an **admin JWT token**.
Read operations are public.

| Method | Endpoint        | Auth         | Description      |
|--------|-----------------|--------------|------------------|
| GET    | `/agents`       | None         | List agents      |
| GET    | `/agents/:id`   | None         | Get one agent    |
| POST   | `/agents`       | Admin token  | Create an agent  |
| PATCH  | `/agents/:id`   | Admin token  | Update an agent  |
| DELETE | `/agents/:id`   | Admin token  | Delete an agent  |

#### Query parameters for `GET /agents`

| Parameter        | Type   | Default | Description |
|------------------|--------|---------|-------------|
| `page`           | number | `1`     | Page number |
| `limit`          | number | `10`    | Results per page (max 100) |
| `search`         | string | —       | Full-text search across `name`, `title`, `specialization`, `bio`, and `nationality` |
| `name`           | string | —       | Filter by name (partial match, case-insensitive) |
| `specialization` | string | —       | Filter by specialization (partial match, case-insensitive) |
| `language`       | string | —       | Filter by a language the agent speaks |
| `nationality`    | string | —       | Filter by nationality (exact match, case-insensitive) |
| `sortBy`         | string | —       | Sort field: `name` \| `title` \| `agency` \| `rating` \| `closedDeals` |
| `sortOrder`      | string | `asc`   | Sort direction: `asc` \| `desc` |

> `sortBy=agency` sorts agents by their agency's name.

**Examples:**

```
# Top-rated agents first
GET /agents?sortBy=rating&sortOrder=desc

# French-speaking agents who specialize in villas
GET /agents?language=French&specialization=villa

# Search across all agent fields, sorted by closed deals
GET /agents?search=luxury&sortBy=closedDeals&sortOrder=desc
```

---

### Pagination response format

All list endpoints return the same structure:

```json
{
  "data": [ ... ],
  "meta": {
    "total": 84,
    "page": 1,
    "limit": 10,
    "totalPages": 9
  }
}
```

---

## 12. Quick-Start Checklist

Use this checklist at the start of every work session.

- [ ] Open Docker Desktop and wait for the daemon to be ready
- [ ] Run `docker compose start` to start the PostgreSQL container
- [ ] Run `pnpm run start:dev` to start the NestJS server
- [ ] Confirm you see `[NestApplication] Nest application successfully started`
- [ ] API is live at `http://localhost:3000`
- [ ] Swagger UI is live at `http://localhost:3000/api`
