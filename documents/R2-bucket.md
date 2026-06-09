# Cloudflare R2 — Property Image Uploads

How property images are uploaded and stored using Cloudflare R2 (S3-compatible
object storage), and how orphaned uploads are cleaned up.

## Overview

Images are uploaded **directly from the browser to R2** using presigned URLs.
The backend never receives or stores binary image data — it only generates
presigned upload URLs and stores the resulting object **keys** (not files) on
the `Property.gallery` field.

```
1. Admin picks images in the form
2. POST /uploads/presign  → backend returns [{ key, url }] (presigned PUT URLs)
3. Browser PUTs each file directly to its signed R2 URL
4. Browser submits POST /properties with the resulting tmp/ keys in `gallery`
5. Backend creates the property, then promotes tmp/ → properties/{id}/
6. API responses resolve stored keys to public URLs
```

Because the database only ever sees object **keys**, a property that fails to
be created simply leaves behind unreferenced objects in R2 under `tmp/` —
nothing is ever written to the DB pointing at them. Those orphans are cleaned
up automatically by an R2 lifecycle rule (see below). Properties that *are*
created have their images **promoted** out of `tmp/` into a permanent
`properties/{id}/` prefix so the same lifecycle rule doesn't delete them.

## Packages

```
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

R2 is S3-compatible, so the standard AWS SDK v3 clients work against R2's
endpoint.

## Environment variables

Added to `.env`, `.env.dev`, `.env.qa`, `.env.prod`:

```
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=okapi-properties
R2_PUBLIC_URL=https://your-public-r2-domain.example.com
```

- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — R2 API token
  credentials (Cloudflare dashboard → R2 → Manage API tokens)
- `R2_BUCKET_NAME` — the bucket property images are stored in
- `R2_PUBLIC_URL` — the public domain serving the bucket (custom domain or
  `r2.dev` subdomain — must be enabled under bucket → Settings → Public access)

## New module: `src/uploads`

| File | Purpose |
| --- | --- |
| `uploads.module.ts` | Registers the controller/service |
| `uploads.service.ts` | Configures `S3Client` for R2 (`region: "auto"`, endpoint `https://{accountId}.r2.cloudflarestorage.com`); generates presigned `PutObjectCommand` URLs and promotes `tmp/` objects to a permanent prefix via `CopyObjectCommand` + `DeleteObjectsCommand` |
| `uploads.controller.ts` | `POST /uploads/presign` (admin-only, `JwtAdminGuard`) |
| `dto/presign-upload.dto.ts` | Validates 1–20 files, restricts `contentType` to `image/jpeg\|png\|webp\|avif` |

### `POST /uploads/presign`

Request:
```json
{ "files": [{ "filename": "living-room.jpg", "contentType": "image/jpeg" }] }
```

Response:
```json
[{ "key": "tmp/3f1c...-uuid.jpg", "url": "https://...signed-put-url..." }]
```

- Each file gets a random key under the `tmp/` prefix (`tmp/<uuid>.<ext>`)
- Presigned URLs expire after 5 minutes (`PRESIGN_TTL_SECONDS`)
- The browser `PUT`s the file body directly to `url`; the resulting `key` is
  what gets sent to `POST /properties` in the `gallery` array

## Gallery URL resolution (`properties.service.ts`)

`Property.gallery` stores lightweight R2 **keys**, not full URLs. The service
resolves them to public URLs on every read/write response via:

- `toGalleryUrl(key)` — prefixes a key with `R2_PUBLIC_URL`
- `withGalleryUrls(property)` — maps `gallery: string[]` through `toGalleryUrl`

Applied in `findAll`, `findOne`, `create`, and `update`, so API consumers
always receive ready-to-use URLs (e.g.
`https://your-public-r2-domain.example.com/tmp/3f1c...-uuid.jpg`) while the DB
keeps storing compact keys.

## Cleaning up orphaned uploads (R2 lifecycle rule)

If a property is never created (validation fails, user abandons the form,
etc.), the images already uploaded to `tmp/` become orphans — referenced
nowhere in the DB. Rather than handling this in application code, an **R2
object lifecycle rule** auto-deletes anything under `tmp/` after a set period.

**Dashboard:** R2 → bucket → Settings → Object lifecycle rules → Add rule
- Prefix: `tmp/`
- Action: Delete objects (expire)
- After: 1 day

**Wrangler CLI:**
```bash
npx wrangler login
npx wrangler r2 bucket lifecycle add <bucket-name> expire-tmp-uploads tmp/ --expire-days 1
npx wrangler r2 bucket lifecycle list <bucket-name>
```

This guarantees temp uploads never accumulate or linger if property creation
fails, without any extra cleanup code in the backend.

## Promoting `tmp/` → `properties/{id}/` on create

A successfully created property must not keep its images under `tmp/` —
otherwise the lifecycle rule above would delete them after 1 day. So
`PropertiesService.create` promotes the gallery right after the DB write:

```
1. prisma.property.create(...)                         → property gets an id
2. uploadsService.promoteKeys(gallery, property.id)    → copies tmp/<key> to
                                                          properties/{id}/<key>,
                                                          then batch-deletes the
                                                          tmp/ originals
3. prisma.property.update({ gallery: promotedKeys })   → persists permanent keys
```

`UploadsService.promoteKeys(tmpKeys, propertyId)`:
- Copies each object with `CopyObjectCommand` (`CopySource: "{bucket}/{tmpKey}"`,
  `Key: "properties/{propertyId}/{filename}"`, reusing the original filename so
  keys stay traceable)
- Deletes all `tmp/` originals in a single `DeleteObjectsCommand` batch call
- Returns the new permanent keys in the same order as the input

We didn't go with "skip `tmp/` entirely and presign straight into
`properties/{id}/`" because the property id doesn't exist yet at presign time
— promote-on-create is the only ordering that works with this flow.

### Failure scenarios

| Scenario | Result |
| --- | --- |
| User abandons the form after uploading | `tmp/` keys expire automatically via the lifecycle rule (1 day) |
| `POST /properties` DB write fails | Property never created; `tmp/` keys expire automatically |
| DB write succeeds, promotion fails | Property is created and returned with its (still-working) `tmp/` URLs; the error is logged via `Logger.error` with the property id and the affected keys for manual recovery. **These keys will still expire in 1 day** — see below |
| Everything succeeds | Keys live under `properties/{id}/`, `tmp/` originals deleted immediately |

`create()` does **not** roll back or fail the request if promotion throws —
the property record is the source of truth and already exists at that point,
so surfacing a 500 to the admin would be misleading (the property *was*
created). Instead the error is logged with enough detail
(`property.id` + the original `tmp/` keys) to manually re-run promotion or
re-upload images.

### Possible follow-up (not yet implemented)

The remaining gap is the "promotion fails" row: today it relies on someone
noticing the logged error within the lifecycle window. A small background job
that periodically scans for properties whose `gallery` still contains `tmp/`
keys and retries `promoteKeys` for them would close this gap without adding
synchronous complexity to the create path.
