# 🛡️ Operation Sparta

Operation Sparta is a high-fidelity AI supervision engine and social media automation platform designed for modern brands and agencies. Built on a robust **Multi-Tenant SaaS Architecture**, the platform allows individual users to securely define brands, integrate their own AI models, generate high-quality content via an automated engine, and publish directly to their social channels.

---

## 🌟 The End-User Journey

Here is the step-by-step flow of how an end-user interacts with Operation Sparta to automate their social presence:

### 1. Authentication (Command Center Access)
- The user lands on the premium, glassmorphism-styled Login page.
- Using the toggle component, they can **Sign Up** for a new account by providing an email, password, and a unique **Username**.
- Upon creation, a verification email is sent. Once verified, the user is securely logged in using **Supabase Auth** and their profile is provisioned in the database.
- Any attempt to access protected routes without a session automatically redirects back to the login gateway.

### 2. Creating a Project (Brand Profile)
- Upon logging into the **Overview Dashboard**, the user clicks "New Project".
- A Project acts as a brand profile or campaign. The user defines:
  - **Brand Name**
  - **Industry**
  - **Target Audience**
  - **Brand Voice & Tone**
- This ensures that all generated content strictly adheres to the brand's unique identity.

### 3. System Configuration & Integrations (Settings)
Before generating content, the user securely connects their external accounts in the **System Configuration** tab:
- **Bring Your Own Key (BYOK):** The user enters their OpenAI (`gpt-4o`) or Google Gemini API key. The platform securely validates the key, encrypts it on the server using AES, and stores the encrypted blob.
- **Social Destination (Instagram):** The user clicks "Authenticate Instagram", triggering the secure **Meta Managed Business Login**. 
  - They log into Facebook and select their specific Instagram Business account. 
  - Behind the scenes, Sparta exchanges temporary codes for permanent 60-day access tokens.
  - The UI updates dynamically, fetching and displaying their **Instagram Profile Picture**, **@Username**, and a "Connected" badge directly from the Graph API.

### 4. Content Generation (The Studio)
- The user navigates to the **Content Studio** and selects one of their defined Projects.
- They click **"Trigger Engine"**.
- This makes a secure server-side call that pings an external **n8n Automation Webhook**, passing the user's encrypted AI credentials and the Brand Profile data.
- The n8n engine does the heavy lifting: interpreting the brand voice, generating a high-converting caption, defining an image prompt, and generating the actual image asset.
- Once finished, n8n blasts the final asset data back to Sparta's `webhook/generation` endpoint, storing the post in a `Pending` state.

### 5. Review, Approval & Automated Publishing
- The generated post instantly appears in the Content Studio.
- The user reviews the image, caption, and hashtags. 
- If perfect, they hit **"Approve & Post"**.
- The platform retrieves the user's securely stored Instagram Access Token and Page ID, and pushes the image and caption directly to their Instagram grid using the **Meta Graph API**.
- The post status updates to `Published`.

---

## 🛠️ Technology Stack

Operation Sparta leverages a bleeding-edge architectural stack to ensure data isolation, speed, and beautiful design aesthetics.

### Frontend
- **Framework:** Next.js 16/17 (App Router)
- **Styling:** Tailwind CSS (v4) with custom Glassmorphism tokens
- **Icons & UI:** Lucide React
- **Aesthetics:** Vibrant colors, smooth gradients, deep dark modes, and micro-animations to deliver a "wow" experience.

### Backend & Database
- **Auth & Database Engine:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM for type-safe database queries and schema definitions
- **API Architecture:** Next.js Server Actions and API Routes
- **Session Management:** `@supabase/ssr` middleware with a custom `proxy.ts` router guard.

### External Integrations
- **Social Automation:** Meta Graph API v19.0 (Instagram Managed Business Login)
- **AI Processing:** Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`)
- **Workflow Engine:** n8n Webhooks

---

## 🔒 Security & Multi-Tenancy

- **Data Isolation:** Every Project and Post is tied to a specific `userId`, enforced at the query level via Drizzle ORM.
- **Credential Encryption:** End-user API keys are never stored in plaintext. They are encrypted using server-side secrets and initialization vectors (IV) before hitting the database, and only decrypted in-memory during a content generation request.
- **Managed Tokens:** Instagram credentials are automatically refreshed and scoped specifically to the sub-user's Facebook Page, ensuring they can only post to accounts they specifically authorized during the OAuth consent flow.
