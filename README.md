# Okapi Real Estate API

A RESTful backend API for a real estate platform, built with NestJS, Prisma, and JWT authentication.

## Tech Stack

- **Framework:** NestJS (Node.js + TypeScript)
- **ORM:** Prisma
- **Auth:** JWT (separate user and admin strategies)
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger (`/api`)
- **Package Manager:** pnpm

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Environment variables

Create a `.env` file at the root with at least:

```env
DATABASE_URL="your-database-url"
JWT_SECRET="your-jwt-secret"
JWT_ADMIN_SECRET="your-admin-jwt-secret"
PORT=8080
```

### Run the app

```bash
# development (watch mode)
pnpm run start:dev

# production
pnpm run start:prod
```

The server starts on `http://localhost:8080` by default.  
Swagger UI is available at `http://localhost:8080/api`.

## API Overview

### Authentication

| Method | Endpoint         | Description          | Auth      |
|--------|-----------------|----------------------|-----------|
| POST   | `/auth/register` | Register a new user  | Public    |
| POST   | `/auth/login`    | Login and get JWT    | Public    |

---

### Properties

| Method | Endpoint           | Description              | Auth       |
|--------|--------------------|--------------------------|------------|
| GET    | `/properties`      | List properties (filtered)| Public    |
| GET    | `/properties/:id`  | Get a single property    | Public     |
| POST   | `/properties`      | Create a property        | Admin JWT  |
| PATCH  | `/properties/:id`  | Update a property        | Admin JWT  |
| DELETE | `/properties/:id`  | Delete a property        | Admin JWT  |

#### `GET /properties` — Query Parameters

| Parameter     | Type    | Description                              |
|---------------|---------|------------------------------------------|
| `listingType` | string  | Filter by listing type (e.g. `sale`, `rent`) |
| `category`    | string  | Property category (e.g. `apartment`, `house`) |
| `city`        | string  | City name                                |
| `suburb`      | string  | Suburb name                              |
| `minPrice`    | number  | Minimum price                            |
| `maxPrice`    | number  | Maximum price                            |
| `bedrooms`    | integer | Number of bedrooms                       |
| `bathrooms`   | integer | Number of bathrooms                      |
| `minArea`     | number  | Minimum area in m²                       |
| `maxArea`     | number  | Maximum area in m²                       |
| `period`      | string  | Rental period (e.g. `monthly`, `yearly`) |
| `verified`    | boolean | Only show verified listings (`true`/`false`) |
| `premium`     | boolean | Only show premium listings (`true`/`false`)  |
| `page`        | integer | Page number (default: `1`)               |
| `limit`       | integer | Results per page (default: `10`, max: `100`) |

**Example:**
```
GET /properties?city=Kinshasa&listingType=rent&minPrice=500&maxPrice=2000&bedrooms=2&page=1&limit=20
```

---

### Agencies

| Method | Endpoint          | Description         | Auth      |
|--------|-------------------|---------------------|-----------|
| GET    | `/agencies`       | List agencies        | Public    |
| GET    | `/agencies/:id`   | Get a single agency  | Public    |
| POST   | `/agencies`       | Create an agency     | Admin JWT |
| PATCH  | `/agencies/:id`   | Update an agency     | Admin JWT |
| DELETE | `/agencies/:id`   | Delete an agency     | Admin JWT |

---

### Agents

| Method | Endpoint        | Description        | Auth      |
|--------|-----------------|--------------------|-----------|
| GET    | `/agents`       | List agents        | Public    |
| GET    | `/agents/:id`   | Get a single agent | Public    |
| POST   | `/agents`       | Create an agent    | Admin JWT |
| PATCH  | `/agents/:id`   | Update an agent    | Admin JWT |
| DELETE | `/agents/:id`   | Delete an agent    | Admin JWT |

---

### Users

| Method | Endpoint      | Description      | Auth     |
|--------|---------------|------------------|----------|
| GET    | `/users`      | List users       | User JWT |
| PATCH  | `/users/:id`  | Update a user    | User JWT |

## Testing

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# coverage
pnpm run test:cov
```
