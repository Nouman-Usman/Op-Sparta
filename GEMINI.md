# 🛡️ Operation Sparta | Project Context

Operation Sparta is a high-fidelity, multi-tenant AI supervision engine and social media automation platform. It enables brands and agencies to securely integrate their own AI models (BYOK), generate high-quality Instagram content via an n8n-driven pipeline, and publish directly to social channels.

## 🚀 Quick Start

### Core Commands
```bash
# Development
npm run dev          # Start Next.js development server
npm run lint         # Run ESLint
npm run test         # Run Vitest test suite

# Database (Drizzle)
npx drizzle-kit generate   # Generate migrations from schema
npx drizzle-kit migrate    # Apply migrations to database
npx drizzle-kit studio     # Open database GUI
```

### Environment Setup
Required `.env` variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase project credentials
- `SUPABASE_SERVICE_ROLE_KEY`: Service role for server-side elevated tasks
- `ENCRYPTION_KEY`: Secret for AES-256 (AI keys & social tokens)
- `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_REDIRECT_URI`: Meta App credentials
- `N8N_WEBHOOK_URL`: Primary content generation trigger

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework:** Next.js 16/17 (App Router)
- **Styling:** Tailwind CSS v4 (Glassmorphism, custom tokens)
- **Animations:** GSAP, `@react-three/fiber` (Three.js) for 3D elements
- **UI Components:** Radix UI primitives, `sonner` for toasts, Lucide React icons

### Backend
- **Auth:** Supabase Auth with `@supabase/ssr`
- **Database:** PostgreSQL (Supabase) with Drizzle ORM
- **Routing/Guard:** `src/proxy.ts` (Next.js Middleware) handles session refresh and auth redirects
- **Mutations:** Primarily implemented as Server Actions in `src/app/actions/`

### External Integrations
- **AI Engine:** Vercel AI SDK (OpenAI, Google Gemini)
- **Workflow Automation:** n8n via webhooks (`/api/webhooks/n8n/`)
- **Social:** Meta Graph API v19.0 for Instagram Managed Business Login and publishing

---

## 📂 Project Structure

| Path | Purpose |
|---|---|
| `src/app/` | Pages, Layouts, and API Routes |
| `src/app/(dashboard)/` | Protected application routes (Studio, Analytics, Settings, etc.) |
| `src/app/actions/` | Server Actions (the primary mutation surface) |
| `src/lib/` | Core business logic (AI, Social, Encryption, Supervision) |
| `src/db/` | Drizzle schema (`schema.ts`) and client initialization (`index.ts`) |
| `src/utils/supabase/` | Supabase client factories (client, server, middleware) |
| `src/components/` | React UI components (primitives and feature-specific) |
| `docs/` | System specifications and implementation plans |

---

## 🔒 Security & Data Integrity

### Multi-Tenancy (Critical)
Every record in `projects`, `posts`, `ai_keys`, and `prompts` is tied to a `userId`.
- **Enforcement:** All Drizzle queries **MUST** filter by `userId`.
- **Auth context:** Always derive `userId` from the Supabase session on the server; never trust a `userId` passed from the client.

### Credential Protection
- **AES-256 Encryption:** AI API keys and Instagram access tokens are encrypted at rest using `src/lib/encryption.ts`.
- **In-Memory Only:** Sensitive keys are decrypted only during active generation or publishing tasks and are never exposed to the browser.

---

## 🛠️ Development Conventions

- **Type Safety:** Ensure all database interactions use Drizzle's type-safe query builders.
- **Server Actions:** Prefer Server Actions over API routes for user-triggered mutations.
- **Structured AI Output:** Use `src/lib/ai/supervision.ts` with Zod schemas for consistent AI content generation.
- **Social Logic:** Centralize Instagram interactions in `src/lib/social/instagram.ts`.
- **Testing:** Add Vitest unit tests for new logic in `src/lib/` or critical Server Actions.
- **UI Consistency:** Follow the Glassmorphism design system; use `clsx` and `tailwind-merge` for style composition.
