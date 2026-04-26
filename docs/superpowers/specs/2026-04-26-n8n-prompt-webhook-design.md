# N8N Prompt Webhook & Regeneration Design

**Date:** 2026-04-26  
**Status:** Design approved

## Overview

Enable users to regenerate images by storing and reusing prompts from n8n. When n8n generates an image, it sends the prompt used to our webhook. Later, when the user clicks "Regenerate," the latest prompt is retrieved and sent back to n8n for improved generation.

## Data Model

### New Table: `prompts`

```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId UUID NOT NULL REFERENCES posts(id),
  projectId UUID NOT NULL REFERENCES projects(id),
  userId UUID NOT NULL REFERENCES users(id),
  prompt TEXT NOT NULL,
  version INTEGER NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_post_version UNIQUE(postId, version)
);

CREATE INDEX idx_prompts_postId ON prompts(postId);
CREATE INDEX idx_prompts_postId_createdAt ON prompts(postId, createdAt DESC);
```

**Version Scheme:** Auto-increments per post. First prompt = v1, second = v2, etc.

## API Endpoints

### 1. Webhook: Store Prompt (n8n → API)

**Endpoint:** `POST /api/webhooks/n8n-prompt`

**Request Payload:**
```json
{
  "projectId": "uuid",
  "postId": "uuid",
  "userId": "uuid",
  "prompt": "A vibrant sunset over mountains..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "version": 1,
  "message": "Prompt stored successfully"
}
```

**Error Responses:**
- `400 Bad Request` — Missing required fields (projectId, postId, userId, prompt)
- `404 Not Found` — postId does not exist
- `500 Internal Server Error` — Database error

**Logic:**
1. Validate all required fields present
2. Verify postId exists in posts table
3. Calculate next version for this postId (MAX(version) + 1)
4. Insert new row into prompts table
5. Return success with version number

**Logging:** Match existing n8n webhook pattern with timestamps and status markers.

### 2. Regeneration: Fetch Latest Prompt (UI → API)

**Endpoint:** `GET /api/prompts/latest`

**Query Parameters:**
- `postId` (required) — UUID of the post

**Response (200 OK):**
```json
{
  "prompt": "A vibrant sunset over mountains...",
  "version": 2
}
```

**Error Responses:**
- `400 Bad Request` — Missing postId
- `404 Not Found` — postId does not exist OR no prompts stored yet

**Logic:**
1. Validate postId provided
2. Verify postId exists in posts table
3. Query prompts table: `WHERE postId = ? ORDER BY createdAt DESC LIMIT 1`
4. Return prompt and version

**Frontend Usage:**
- User clicks "Regenerate" button
- UI calls this endpoint
- Displays version info (optional: "Regenerating from v2...")
- Sends returned prompt back to n8n

## Error Handling

| Scenario | Status | Response |
|----------|--------|----------|
| n8n sends webhook without prompt | 400 | `{ success: false, error: "Missing required field: prompt" }` |
| Post being regenerated doesn't exist | 404 | `{ success: false, error: "Post not found" }` |
| User tries to regenerate but no prompts stored | 404 | `{ prompt: null, error: "No prompts found for this post" }` |
| Database connection error | 500 | `{ success: false, error: "Database error" }` |

## Implementation Notes

- Use existing Drizzle ORM patterns from codebase
- No authentication required (n8n webhook is internal, GET endpoint assumes same-origin requests)
- Minimal validation (existence checks only, trust input format from n8n)
- No need to revalidate paths (regeneration doesn't modify existing posts, just stores prompts)
- Version tracking is automatic via database UNIQUE constraint

## Testing Strategy

**Unit Tests:**
- Webhook correctly calculates next version number
- GET endpoint returns latest prompt (not oldest)
- Handles missing/invalid postId gracefully

**Integration Tests:**
- Webhook stores prompt in DB
- Multiple regenerations increment version correctly
- GET endpoint retrieves correct version after each webhook call

**Manual Testing:**
- Trigger n8n webhook with sample payload
- Call GET endpoint, verify prompt returned
- Trigger webhook again, verify version incremented to v2
- Call GET endpoint, verify v2 returned

## Future Considerations

- Add prompt comparison endpoint (show diff between versions)
- Add UI to select specific version for regeneration (not just latest)
- Add prompt analytics (which versions generated best images?)
