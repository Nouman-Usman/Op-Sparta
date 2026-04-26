# CLAUDE.md Design Specification

**Date:** 2026-04-26  
**Project:** Operation Sparta  
**Goal:** Create developer guidance document for future Claude instances working on Sparta codebase.

---

## Approach

Quick Start + Reference Library structure. Devs get moving fast, find patterns by need, data isolation rules explicit.

---

## CLAUDE.md Structure

### 1. Essential Commands (terse, no explanation)
- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — production server
- `npm run lint` — ESLint check
- Test single file: `npm run test src/lib/encryption.ts`
- Database migrations: `npx drizzle-kit push` / `generate`
- One-liners only

**Why:** Devs need commands immediately, no friction.

### 2. Project Layout
- `/src/app/` — pages, routes, API endpoints, Server Actions
- `/src/lib/` — business logic: encryption, AI providers, social integrations
- `/src/db/` — Drizzle schema definitions, type-safe query helpers
- `/src/app/actions/` — Server Actions for mutations (projects, posts, integrations)
- `/src/utils/supabase/` — auth middleware, client initialization, session handling
- `/src/components/` — React UI components
- Brief descriptor for each, emphasis on "where to find what"

**Why:** Mental model of codebase structure enables independent exploration.

### 3. Data Isolation & Query Safety
Core multi-tenant pattern: `userId` is the tenant key, enforced everywhere.

**Rules:**
- Every query/mutation filters by `userId` at ORM level
- Server Actions inherit userId from session (Supabase SSR middleware)
- API routes must explicitly extract and validate userId from session
- Never pass userId from client — derive from auth context only

**Code example:**
- ✅ Safe: `db.select().from(projects).where(eq(projects.userId, userId))`
- ❌ Unsafe: `db.select().from(posts).where(eq(posts.id, postId))` (missing userId filter)

**Common pitfall:** Forgetting userId filter in queries = data leak across tenants.

**Why:** Data isolation is non-negotiable security boundary. Explicit patterns prevent bugs.

### 4. Integration Cookbook

#### Instagram
- **Flow:** User auth → credential exchange → token storage (encrypted) → publishing
- **Key files:**
  - `src/app/api/auth/instagram/route.ts` — OAuth initiation
  - `src/app/api/auth/instagram/callback/route.ts` — token exchange
  - `src/lib/social/instagram.ts` — publish logic
  - `src/app/actions/publish.ts` — Server Action wrapper
- **Security:** Access tokens encrypted in `users.instagramAccessToken`, decrypted in-memory only during publish
- **Extending:** Add Threads integration by copying Instagram pattern, swap Graph API endpoint + permissions

#### n8n Webhooks
- **Flow:** Trigger generation → n8n processes brand + AI config → webhook callback stores post
- **Key files:**
  - `src/app/api/generate/route.ts` — calls n8n webhook with encrypted AI keys
  - `src/app/api/webhooks/n8n/route.ts` — receives generated asset, stores in `posts` table
- **Payload:** brand profile, encrypted AI credentials, target platform
- **Extending:** Add video generation by extending webhook payload + handling new asset type

#### AI Providers (OpenAI, Google Gemini)
- **Flow:** User stores encrypted API key → Server Action retrieves + decrypts → AI SDK calls provider
- **Key files:**
  - `src/lib/encryption.ts` — AES encryption/decryption with IV
  - `src/lib/ai/providers.ts` — provider client setup
  - `src/app/actions/save-ai-keys.ts` — key storage
- **Security:** Keys encrypted before DB storage, decrypted only in Server Actions
- **Extending:** Add new provider (Claude, Anthropic) by adding entry to `aiKeys.provider`, extending `providers.ts` logic

### 5. Testing & Local Setup

**Environment (`.env.local`):**
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
N8N_WEBHOOK_URL=...
OPENAI_API_KEY=... (optional, for local testing)
```

**Mocking strategies:**
- **n8n:** Mock webhook endpoint locally (`http://localhost:3000/api/webhooks/n8n`) or disable for unit tests
- **Instagram:** Mock Graph API responses in tests; use staging Business account for integration tests
- **AI providers:** Mock via `@ai-sdk/openai` / `@ai-sdk/google` test utilities or mock fetch

**Running locally:**
- Auth flow works end-to-end (Supabase local setup optional, can use staging)
- Instagram OAuth requires registered redirect URI; use `http://localhost:3000/api/auth/instagram/callback` for dev
- n8n webhook can point to ngrok tunnel for local testing

---

## Coverage

- ✓ Developer workflow patterns (query safely, extend integrations)
- ✓ Integration cookbook with extension examples
- ✓ Data isolation rules + code samples
- ✓ Quick command reference
- ✓ Testing + local setup

---

## Scope & Assumptions

- Assumes dev has Node/npm, PostgreSQL, Supabase account
- Focuses on extension/modification workflows, not from-scratch setup
- Does not cover deployment (that's separate)
- Does not list every component (discoverable by reading code)
