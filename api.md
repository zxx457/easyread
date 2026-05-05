# API Documentation (Backend Integration)

This file documents the API contract currently used by the frontend under `src/app/api`.  
Most routes in this app are thin pass-through proxies to the backend service configured by `BACKEND_BASE_URL`.

## Base URL and Routing

- Frontend API base (used by browser): `/api/*`
- Upstream backend base (used by route handlers): `BACKEND_BASE_URL` from `src/lib/config/backend.ts`
- Effective backend base fallback order:
  1. `process.env.BACKEND_BASE_URL`
  2. `process.env.NEXT_PUBLIC_API_URL`
  3. `http://localhost:5050`

Only `/api/documents/*` is documented in this file.

## Authentication

Authentication in this repository is currently mocked by cookie.

- Cookie name: `easyread_auth`
- Cookie success value: `mock-session`
- Login route sets cookie with:
  - `Path=/`
  - `HttpOnly`
  - `SameSite=Lax`
  - `Max-Age=604800` (7 days)
- Logout route clears cookie with `Max-Age=0`

## Endpoint Reference

## 1) Auth and session

### POST `/api/auth/login`

Authenticates against mock credentials and sets auth cookie.

Request body:

```json
{
  "email": "string",
  "password": "string"
}
```

Success response:

```json
{
  "ok": true
}
```

Error response (`401`):

```json
{
  "message": "Invalid email or password"
}
```

### POST `/api/auth/logout`

Clears auth cookie.

Success response:

```json
{
  "ok": true
}
```

### GET `/api/auth/session`

Returns authentication state based on cookie.

Success response:

```json
{
  "isAuthenticated": true
}
```

### GET `/api/users/me`

Returns current user profile when authenticated.

Success response (`200`):

```json
{
  "displayName": "string",
  "avatar": "string",
  "email": "string"
}
```

Error response (`401`):

```json
{
  "message": "Unauthorized"
}
```

## 2) Documents

These frontend routes proxy directly to backend `/api/documents`.

### GET `/api/documents`

Lists documents and forwards query parameters as-is to backend.

Common query params used by frontend:

- `page` (number, 1-based)
- `page_size` (number)
- `order_by` (`title | -title | modified | -modified | created | -created`)
- `search` (string, optional)

Frontend expects backend to return an array of document objects.

### POST `/api/documents`

Creates document.

Request body shape used by frontend:

```json
{
  "files": ["uploaded-file-id"],
  "query": "string",
  "language_style": "plain",
  "auto_generate_images": true,
  "image_generation_options": {}
}
```

Notes:

- `language_style` is expected as `"plain"` or `"easyread"`.
- Frontend accepts response as either:
  - raw string document id, or
  - object containing `id` or `doc_id`.

### GET `/api/documents/:id`

Returns one document by id.

### PATCH `/api/documents/:id`

Partial update of document.

Request body used by frontend for title update:

```json
{
  "title": "New title"
}
```

### DELETE `/api/documents/:id`

Deletes a document.

## 3) Sections

### GET `/api/documents/:id/sections`

Returns list of section IDs for document.

Frontend expects:

```json
["section-id-1", "section-id-2"]
```

### POST `/api/documents/:id/sections`

Creates a new section for document.

Frontend expects response to be the created section ID:

```json
"new-section-id"
```

### POST `/api/documents/:id/sections/reorder`

Reorders section position.

Request body used by frontend:

```json
{
  "target": "section-id-to-move",
  "after": "optional-section-id",
  "before": "optional-section-id"
}
```

At least one of `after` or `before` should be provided by caller.

### GET `/api/sections/:id`

Returns full section object.

Frontend uses fields:

```json
{
  "id": "string",
  "doc_id": "string",
  "document_id": "string",
  "text": "string",
  "image": "string"
}
```

Notes:

- `doc_id` or `document_id` is accepted by frontend parser.
- If `image` is not an absolute URL, frontend will render a placeholder image URL.

### PATCH `/api/sections/:id`

Updates section fields.

Request body used by frontend:

```json
{
  "text": "optional string",
  "image": "optional string"
}
```

### DELETE `/api/sections/:id`

Deletes section.

### GET `/api/sections/:id/candidates`

Returns candidate image IDs for section.

Frontend expects:

```json
["candidate-id-1", "candidate-id-2"]
```

### POST `/api/sections/:id/candidates`

Generates candidate images for section.

Request body: arbitrary JSON object (frontend currently sends free-form options object).

Frontend expects response:

```json
["candidate-id-1", "candidate-id-2"]
```

## 4) Uploads

### POST `/api/upload`

Forwards multipart form-data upload to backend `/api/upload`.

Request content type: `multipart/form-data`

Expected form field from frontend:

- `file`: binary file

Frontend accepts response payload containing uploaded id in one of:

- `id`
- `file_id`
- `fileId`

## 5) Images (local mock endpoint)

### GET `/api/images`

Returns mock image list from in-repo mock data (not proxied to backend).

Response shape:

```json
[
  {
    "id": "string",
    "created": "2026-01-01T00:00:00.000Z",
    "url": "https://..."
  }
]
```

## Proxy behavior and headers

For proxied routes:

- Response body is returned as text and forwarded directly.
- Status code is preserved from backend.
- `Content-Type` is forwarded when available; otherwise defaults to `application/json`.
- Read endpoints generally use `cache: "no-store"` to avoid stale data.

## Quick checklist for backend developers

- Implement all `/api/documents*` and `/api/sections*` routes listed above.
- Ensure JSON response shapes match frontend expectations (especially array vs object vs raw string id cases).
- Support multipart upload at `/api/upload`.
- Keep auth endpoints aligned if moving from mock auth to real auth (`/api/auth/*`, `/api/users/me`).
