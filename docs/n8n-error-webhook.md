# N8N Error Webhook

**Endpoint:** `POST /api/webhooks/n8n-error`

When an n8n generation workflow fails, call this endpoint to mark the post as `failed` in the Sparta database and surface the error message directly in the Studio UI.

---

## Request

### URL

```
POST https://sparta-ai-aut.vercel.app/api/webhooks/n8n-error
```

### Headers

```
Content-Type: application/json
```

### Body

| Field | Type | Required | Description |
|---|---|---|---|
| `postId` | `string` | Recommended | The exact post ID to mark as failed. Pass this when available — it is the most reliable targeting method. |
| `projectId` | `string` | Fallback | If `postId` is not available, the API smart-matches the most recent `generating` post for this project. |
| `error` | `string` | **Required** | Human-readable error message. Shown directly in the Studio card and sidebar. |
| `stage` | `string` | Optional | The n8n node or stage where the failure occurred (e.g. `image_synthesis`, `caption_generation`). Prepended to the error message as `[stage] error`. |

> At least one of `postId` or `projectId` must be provided alongside `error`.

---

## Response

### Success — `200 OK`

```json
{
  "success": true,
  "message": "Error recorded on post"
}
```

### Missing `error` field — `400 Bad Request`

```json
{
  "success": false,
  "error": "Missing required field: error"
}
```

### Could not resolve post — `400 Bad Request`

```json
{
  "success": false,
  "error": "Could not resolve target post"
}
```

### Post ID not found in DB — `404 Not Found`

```json
{
  "success": false,
  "error": "Post not found"
}
```

---

## Setting Up in N8N

### 1. Add an Error Trigger to your workflow

In your generation workflow, open **Settings → Error Workflow** and point it to a dedicated error-handling sub-workflow. Alternatively, add an **Error Trigger** node as the entry point of a new workflow.

### 2. Add an HTTP Request node

Configure the node as follows:

| Setting | Value |
|---|---|
| **Method** | `POST` |
| **URL** | `https://sparta-ai-aut.vercel.app/api/webhooks/n8n-error` |
| **Authentication** | None |
| **Body Content Type** | `JSON` |
| **Send Body** | Enabled |

### 3. Map the body fields

Use **JSON/Expression mode** and map the fields from the error context n8n provides:

```json
{
  "postId": "{{ $json.postId }}",
  "projectId": "{{ $json.projectId }}",
  "error": "{{ $execution.error.message }}",
  "stage": "{{ $execution.error.node.name }}"
}
```

> `$execution.error.message` contains the error text from the failing node.  
> `$execution.error.node.name` is the name of the node that threw the error — use this as `stage`.

### 4. Pass `postId` / `projectId` through your workflow

Make sure your main generation workflow carries `postId` and `projectId` through every node so they are available in the error context. A common pattern is to set them in a **Set** node at the start of the workflow and reference them in subsequent nodes.

---

## Example Payloads

### With `postId` (preferred)

```json
{
  "postId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "error": "Higgsfield API timeout after 30s",
  "stage": "image_synthesis"
}
```


## What Happens in Sparta

1. The post `status` is updated from `generating` → `failed`.
2. The `error_message` column stores the error (formatted as `[stage] error` if stage is provided).
3. The Studio page is revalidated — the failed card appears immediately on next load.
4. In the Studio UI, the post card shows a red error state with the error message visible in both the grid card and the detail sidebar.
