# Property Performance Metrics

Tracks how a listing performs so the dashboard can show **viewed**, **shared**,
and **saved** counts per property.

## Overview

```
performance: {
  viewed: number,  // total page views recorded via POST /properties/:id/view
  shared: number,  // total shares recorded via POST /properties/:id/share
  saved:  number,  // current count of users who favorited the property
}
```

- `viewed` and `shared` are stored counters on `Property` (`viewCount`,
  `shareCount`), incremented on demand.
- `saved` is **not** a stored counter — it's computed live from the existing
  `Favorite` relation (`_count.favorites`), so it always reflects the current
  number of users who have the property in their favorites.

## Schema changes

Migration: `prisma/migrations/20260610081653_add_property_performance_metrics`

```prisma
model Property {
  // ...
  viewCount  Int @default(0)
  shareCount Int @default(0)
}
```

Existing rows were backfilled with `0` for both columns by Postgres' column
default — no data migration was needed.

## API

### Reading metrics

`GET /properties` and `GET /properties/:id` now include a `performance`
object on every property in the response:

```json
{
  "id": "fb14b133-...",
  "title": "Loft Chic 2 Chambres au Cœur de la Ville",
  "...": "...other property fields...",
  "performance": {
    "viewed": 42,
    "shared": 5,
    "saved": 3
  }
}
```

`POST /properties` (create) and `PATCH /properties/:id` (update) responses
also include `performance` for consistency.

### Recording a view

```
POST /properties/:id/view
```

Public (no auth). Increments `viewCount` by 1. Call this from the frontend
when a visitor opens a property's detail page.

Response:

```json
{ "viewed": 43, "shared": 5, "saved": 3 }
```

### Recording a share

```
POST /properties/:id/share
```

Public (no auth). Increments `shareCount` by 1. Call this from the frontend
when a visitor uses the share button.

Response:

```json
{ "viewed": 43, "shared": 6, "saved": 3 }
```

Both endpoints return `404 Not Found` if the property doesn't exist.

### Saved count

No new endpoint — `saved` updates automatically whenever a user adds/removes
the property via the existing `POST /favorites` / `DELETE /favorites/:propertyId`
endpoints (`src/favorites`).

## Implementation

| File | Change |
| --- | --- |
| `prisma/schema.prisma` | Added `viewCount` / `shareCount` to `Property` |
| `src/properties/properties.service.ts` | `withPerformance()` helper shapes `performance`; `recordView()` / `recordShare()` increment counters |
| `src/properties/properties.controller.ts` | `POST /properties/:id/view` and `POST /properties/:id/share` |

## Dashboard usage

Each property returned from `GET /properties?agentId=...` (or `agencyId=...`)
carries its own `performance` object — sum `viewed`, `shared`, and `saved`
across the list to show agent/agency-level totals, or display them per
listing in a properties table.
