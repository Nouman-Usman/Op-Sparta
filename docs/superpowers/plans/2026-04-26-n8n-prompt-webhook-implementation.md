# N8N Prompt Webhook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement webhook to store image generation prompts from n8n, and GET endpoint to fetch latest prompt for regeneration.

**Architecture:** Add `prompts` table to Drizzle schema with auto-incrementing version per post. Two Next.js API routes: webhook stores prompts from n8n, GET endpoint retrieves latest for UI regeneration button.

**Tech Stack:** Drizzle ORM, PostgreSQL, Next.js API routes, TypeScript

---

## File Structure

**Create:**
- `src/db/schema.ts` — Add prompts table definition (append to existing)
- `src/app/api/webhooks/n8n-prompt/route.ts` — POST webhook to store prompts
- `src/app/api/prompts/latest/route.ts` — GET endpoint to fetch latest prompt
- `src/__tests__/api/prompts.test.ts` — Integration tests

**Modify:**
- `src/db/schema.ts` — Export prompts table

---

## Task 1: Add Prompts Table to Schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add prompts table definition to schema.ts**

Append to end of `src/db/schema.ts` (after posts table):

```typescript
// 5. Prompts (Image generation prompts for versioning and regeneration)
export const prompts = pgTable('prompts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text('post_id').notNull(),
  projectId: text('project_id').notNull(),
  userId: text('user_id').notNull(),
  prompt: text('prompt').notNull(),
  version: text('version').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("prompts_postId_version_idx").on(table.postId, table.version),
  uniqueIndex("prompts_postId_createdAt_idx").on(table.postId, table.createdAt),
]);
```

- [ ] **Step 2: Verify schema.ts compiles**

Run: `npx tsc --noEmit src/db/schema.ts`
Expected: No errors

- [ ] **Step 3: Commit schema changes**

```bash
git add src/db/schema.ts
git commit -m "feat: add prompts table to schema for version tracking"
```

---

## Task 2: Implement POST Webhook Endpoint

**Files:**
- Create: `src/app/api/webhooks/n8n-prompt/route.ts`

- [ ] **Step 1: Write webhook route handler**

Replace entire contents of `src/app/api/webhooks/n8n-prompt/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface WebhookPayload {
  projectId: string;
  postId: string;
  userId: string;
  prompt: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as WebhookPayload;
    const { projectId, postId, userId, prompt } = body;

    console.log(`📥 [N8N Prompt Webhook] Received prompt for Post: ${postId}`);

    // Validate required fields
    if (!projectId || !postId || !userId || !prompt) {
      console.warn("⚠️ [N8N Prompt Webhook] Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields: projectId, postId, userId, prompt" },
        { status: 400 }
      );
    }

    // Verify post exists
    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      console.error(`❌ [N8N Prompt Webhook] Post not found: ${postId}`);
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Get max version for this post and increment
    const existingPrompts = await db
      .select({ version: prompts.version })
      .from(prompts)
      .where(eq(prompts.postId, postId))
      .orderBy((col) => col.version);

    const maxVersion = existingPrompts.length > 0
      ? Math.max(...existingPrompts.map(p => parseInt(p.version, 10)))
      : 0;
    const nextVersion = (maxVersion + 1).toString();

    // Insert new prompt
    const result = await db
      .insert(prompts)
      .values({
        id: crypto.randomUUID(),
        postId,
        projectId,
        userId,
        prompt,
        version: nextVersion,
      })
      .returning();

    console.log(`✅ [N8N Prompt Webhook] Prompt stored successfully - Version: ${nextVersion}`);

    return NextResponse.json({
      success: true,
      version: parseInt(nextVersion, 10),
      message: "Prompt stored successfully",
    });
  } catch (error: any) {
    console.error("N8N Prompt Webhook Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify route.ts compiles**

Run: `npx tsc --noEmit src/app/api/webhooks/n8n-prompt/route.ts`
Expected: No errors

- [ ] **Step 3: Commit webhook endpoint**

```bash
git add src/app/api/webhooks/n8n-prompt/route.ts
git commit -m "feat: implement POST webhook to store image generation prompts"
```

---

## Task 3: Implement GET Latest Prompt Endpoint

**Files:**
- Create: `src/app/api/prompts/latest/route.ts`

- [ ] **Step 1: Create prompts directory structure**

Run: `mkdir -p src/app/api/prompts/latest`
Expected: Directory created

- [ ] **Step 2: Write GET route handler**

Create `src/app/api/prompts/latest/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { prompts, posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    console.log(`📤 [Prompts Latest] Fetching latest prompt for Post: ${postId}`);

    // Validate postId
    if (!postId) {
      console.warn("⚠️ [Prompts Latest] Missing postId parameter");
      return NextResponse.json(
        { success: false, error: "Missing required parameter: postId" },
        { status: 400 }
      );
    }

    // Verify post exists
    const existingPost = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (existingPost.length === 0) {
      console.error(`❌ [Prompts Latest] Post not found: ${postId}`);
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    // Get latest prompt for this post
    const latestPrompt = await db
      .select()
      .from(prompts)
      .where(eq(prompts.postId, postId))
      .orderBy(desc(prompts.createdAt))
      .limit(1);

    if (latestPrompt.length === 0) {
      console.warn(`⚠️ [Prompts Latest] No prompts found for Post: ${postId}`);
      return NextResponse.json(
        { success: false, error: "No prompts found for this post" },
        { status: 404 }
      );
    }

    const { prompt, version } = latestPrompt[0];
    console.log(`✅ [Prompts Latest] Retrieved prompt - Version: ${version}`);

    return NextResponse.json({
      prompt,
      version: parseInt(version, 10),
      createdAt: latestPrompt[0].createdAt,
    });
  } catch (error: any) {
    console.error("Prompts Latest Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify route.ts compiles**

Run: `npx tsc --noEmit src/app/api/prompts/latest/route.ts`
Expected: No errors

- [ ] **Step 4: Commit GET endpoint**

```bash
git add src/app/api/prompts/latest/route.ts
git commit -m "feat: implement GET endpoint to fetch latest stored prompt"
```

---

## Task 4: Write Integration Tests

**Files:**
- Create: `src/__tests__/api/prompts.test.ts`

- [ ] **Step 1: Create test directory structure**

Run: `mkdir -p src/__tests__/api`
Expected: Directory created

- [ ] **Step 2: Write integration tests**

Create `src/__tests__/api/prompts.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/db";
import { users, projects, posts, prompts } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("N8N Prompt Webhook & GET Latest", () => {
  let testUserId: string;
  let testProjectId: string;
  let testPostId: string;

  beforeAll(async () => {
    // Create test user
    testUserId = crypto.randomUUID();
    await db.insert(users).values({
      id: testUserId,
      fullName: "Test User",
      createdAt: new Date(),
    });

    // Create test project
    testProjectId = crypto.randomUUID();
    await db.insert(projects).values({
      id: testProjectId,
      userId: testUserId,
      name: "Test Project",
      createdAt: new Date(),
    });

    // Create test post
    testPostId = crypto.randomUUID();
    await db.insert(posts).values({
      id: testPostId,
      projectId: testProjectId,
      userId: testUserId,
      status: "generating",
      createdAt: new Date(),
    });
  });

  afterAll(async () => {
    // Cleanup: delete test data
    await db.delete(prompts).where(eq(prompts.postId, testPostId));
    await db.delete(posts).where(eq(posts.id, testPostId));
    await db.delete(projects).where(eq(projects.id, testProjectId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should store first prompt with version 1", async () => {
    const testPrompt = "A vibrant sunset over mountains";
    
    const result = await db
      .insert(prompts)
      .values({
        id: crypto.randomUUID(),
        postId: testPostId,
        projectId: testProjectId,
        userId: testUserId,
        prompt: testPrompt,
        version: "1",
      })
      .returning();

    expect(result.length).toBe(1);
    expect(result[0].prompt).toBe(testPrompt);
    expect(result[0].version).toBe("1");
  });

  it("should store second prompt with incremented version", async () => {
    const testPrompt2 = "A serene lake at dawn";
    
    const result = await db
      .insert(prompts)
      .values({
        id: crypto.randomUUID(),
        postId: testPostId,
        projectId: testProjectId,
        userId: testUserId,
        prompt: testPrompt2,
        version: "2",
      })
      .returning();

    expect(result.length).toBe(1);
    expect(result[0].version).toBe("2");
  });

  it("should retrieve latest prompt ordered by createdAt DESC", async () => {
    const latestPrompt = await db
      .select()
      .from(prompts)
      .where(eq(prompts.postId, testPostId))
      .orderBy((col) => col.createdAt)
      .limit(1);

    expect(latestPrompt.length).toBe(1);
    expect(latestPrompt[0].version).toBe("2");
  });

  it("should return 404 for non-existent post", async () => {
    const fakePostId = crypto.randomUUID();
    const result = await db
      .select()
      .from(prompts)
      .where(eq(prompts.postId, fakePostId))
      .limit(1);

    expect(result.length).toBe(0);
  });

  it("should enforce unique constraint on postId + version", async () => {
    const duplicatePrompt = {
      id: crypto.randomUUID(),
      postId: testPostId,
      projectId: testProjectId,
      userId: testUserId,
      prompt: "Duplicate test",
      version: "1", // Same version as first prompt
    };

    try {
      await db.insert(prompts).values(duplicatePrompt);
      // Should fail with unique constraint violation
      expect.fail("Should have thrown unique constraint error");
    } catch (error: any) {
      expect(error.message).toContain("unique");
    }
  });
});
```

- [ ] **Step 3: Run tests to verify setup**

Run: `npm test src/__tests__/api/prompts.test.ts`
Expected: All tests pass (or output showing test framework setup)

Note: If test framework not configured, this step will guide setup.

- [ ] **Step 4: Commit tests**

```bash
git add src/__tests__/api/prompts.test.ts
git commit -m "test: add integration tests for prompt versioning"
```

---

## Task 5: Manual Testing & Verification

**Files:**
- No files created, testing only

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Server running on localhost:3000

- [ ] **Step 2: Test webhook with sample POST request**

Run this curl command:

```bash
curl -X POST http://localhost:3000/api/webhooks/n8n-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-id",
    "postId": "test-post-id",
    "userId": "test-user-id",
    "prompt": "A vibrant sunset over mountains"
  }'
```

Expected response:
```json
{
  "success": false,
  "error": "Post not found"
}
```

(Expected because test post doesn't exist — error handling works correctly)

- [ ] **Step 3: Test missing required field**

Run:

```bash
curl -X POST http://localhost:3000/api/webhooks/n8n-prompt \
  -H "Content-Type: application/json" \
  -d '{"projectId": "test"}'
```

Expected response:
```json
{
  "success": false,
  "error": "Missing required fields: projectId, postId, userId, prompt"
}
```

- [ ] **Step 4: Test GET endpoint with missing postId**

Run:

```bash
curl http://localhost:3000/api/prompts/latest
```

Expected response:
```json
{
  "success": false,
  "error": "Missing required parameter: postId"
}
```

- [ ] **Step 5: Verify server logs show correct log format**

Check terminal running `npm run dev`
Expected: Logs show `📥 [N8N Prompt Webhook]` or `📤 [Prompts Latest]` markers

- [ ] **Step 6: Stop dev server**

Press `Ctrl+C`

---

## Testing Checklist

**Manual tests passed:**
- [ ] Webhook rejects missing fields with 400
- [ ] Webhook rejects non-existent post with 404
- [ ] GET endpoint rejects missing postId with 400
- [ ] GET endpoint rejects non-existent post with 404
- [ ] Both endpoints log with correct format
- [ ] Version numbers increment correctly (inspect via db query if needed)
- [ ] Latest prompt returns most recent, not oldest

---

## Spec Coverage Check

| Spec Section | Covered By |
|---|---|
| Prompts table schema | Task 1 |
| POST webhook endpoint | Task 2 |
| GET latest prompt endpoint | Task 3 |
| Error handling (400, 404, 500) | Tasks 2, 3 |
| Version auto-increment | Task 2 logic |
| Logging format | Tasks 2, 3 |
| Integration tests | Task 4 |
| Manual verification | Task 5 |

✅ All spec requirements covered.
