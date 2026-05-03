# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint

# Testing
npm run test         # Run Vitest test suite

# Database
npx drizzle-kit generate   # Generate migrations from schema
npx drizzle-kit migrate    # Apply migrations
npx drizzle-kit studio     # Open Drizzle Studio (DB GUI)
```

## Architecture Overview

**Operation Sparta** is a multi-tenant SaaS platform for AI-driven Instagram content automation. Users connect their Instagram account, define brand projects, generate content via AI, and publish directly to Instagram.

### Request / Auth Flow

- `src/proxy.ts` — Next.js middleware that guards all routes, refreshes Supabase sessions, and redirects unauthenticated users to `/login`
- `src/utils/supabase/` — Three Supabase clients: `server.ts` (Server Components / Actions), `client.ts` (browser), `middleware.ts` (session cookie refresh)
- Instagram OAuth lives in `src/app/api/auth/instagram/` — initiation + callback with Meta Graph API v19

### Content Generation Pipeline

1. User selects a project in Studio and clicks Generate
2. `src/app/actions/` server action calls the n8n webhook with encrypted AI keys + project data
3. n8n orchestrates image synthesis (Higgsfield) and caption generation, then POSTs back to `/api/webhook/generation` which stores the post in `pending` status
4. User previews and approves in Studio → `approveAndPost()` action publishes to Instagram via `src/lib/social/instagram.ts`
5. Post status updates to `published`; metrics are synced on demand via the same Instagram service

### Key Layers

| Layer | Path | Notes |
|---|---|---|
| DB schema | `src/db/schema.ts` | Drizzle ORM + PostgreSQL — `users`, `aiKeys`, `projects`, `posts`, `prompts` |
| DB client | `src/db/index.ts` | Connection pool via `postgres` driver |
| AI providers | `src/lib/ai/providers.ts` | OpenAI (`gpt-4o`, `gpt-4o-mini`) and Google (`gemini-2.5-pro/flash`) via Vercel AI SDK |
| AI supervision | `src/lib/ai/supervision.ts` | Zod schema for structured generation output: `caption`, `headline`, `imagePrompt`, `hashtags`, `supervisionScore` |
| Instagram service | `src/lib/social/instagram.ts` | Photo/video publishing, insight fetching, retry logic for video processing |
| Encryption | `src/lib/encryption.ts` | AES-256 CBC with SHA-256 key derivation and random IVs; all AI keys encrypted at rest in `aiKeys` table |
| Server actions | `src/app/actions/` | `projects.ts`, `publish.ts`, `save-ai-keys.ts` — primary mutation surface |

### Route Groups

- `src/app/(dashboard)/` — Protected routes: `overview`, `studio`, `projects`, `settings`, `analytics`, `planner`, `upload`
- `src/app/api/` — REST endpoints and webhooks (n8n callbacks, cron, Instagram auth, planner)
- `src/app/auth/` — Supabase auth pages (verify, reset-password, callback)

### UI

- `src/components/ui/` — Radix UI primitives (shadcn-style)
- `src/components/studio/StudioClient.tsx` — Primary interactive surface (gallery, preview, editing, metrics, provider selection)
- Tailwind CSS v4 with `next-themes` for dark mode; `sonner` for toasts; `gsap` + `@react-three/fiber` for 3D/animation elements

### Security Model

- AI provider keys are decrypted in-memory only during generation; never sent to the client
- All DB queries enforce `userId` at the query level for tenant isolation
- `ENCRYPTION_KEY` env var drives AES-256; never logged or exposed

### Environment Variables

Required at runtime (see `.env`):

```
DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
INSTAGRAM_APP_ID
INSTAGRAM_APP_SECRET
INSTAGRAM_REDIRECT_URI
ENCRYPTION_KEY
N8N_WEBHOOK_URL          # or equivalent — used in server actions for generation
```
