# 🛡️ Operation Sparta

Operation Sparta is a high-fidelity AI supervision engine designed for seamless content generation and automated social publishing. This platform is built on a **Multi-Tenant SaaS Architecture**, allowing sub-users to connect their own Instagram accounts while leveraging your centralized AI generation engine.

## 🚀 Getting Started

### 1. Prerequisites
- **Supabase**: Database and Authentication.
- **n8n**: Content Generation Engine.
- **Meta Developer Account**: For Instagram "Managed Business Login" capabilities.

### 2. Environment Variables (`.env`)
To run this application seamlessly, create a `.env` file in the root directory with the following variables.

#### Database & Server
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_database_url_pooler

# Your App URL (used for Auth Callbacks)
PRODUCT_URL=http://localhost:3000/
```

#### Social Automation: Meta Business Integration
This app uses **Meta Managed Business Login**, giving users a single button to authenticate without dealing with API tokens manually. You must configure the "Master App" on your backend.

```env
# The App ID and Secret from your Meta Business App
INSTAGRAM_APP_ID=your_meta_business_app_id
INSTAGRAM_APP_SECRET=your_meta_business_app_secret

# The URL users will return to after authenticating
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback

# The Facebook Login Configuration ID
# See "How to Create the Config ID" below
INSTAGRAM_CONFIG_ID=your_meta_login_config_id

# (Optional) Fallback Global Credentials for system-wide testing
INSTAGRAM_ACCESS_ID=your_global_instagram_business_id
INSTAGRAM_ACCESS_TOKEN=your_global_instagram_access_token
```

#### Global AI Generation Engine
```env
# The protected n8n endpoint that generates content. 
# Stored solely on the backend so end-users cannot spam it.
n8nWebhook=https://n8n.your-domain.com/webhook/generation-engine
```

---

## 📸 Setting Up the Master Meta App

To power the "Frictionless UI" where a user simply clicks a button and is connected, you need to properly configure your Meta Developer settings.

### Step 1: Create a Business App
1. Visit [Meta for Developers](https://developers.facebook.com/).
2. Click **My Apps** -> **Create App**.
3. Select **Other** -> **Business**.
4. Note your **App ID** and **App Secret** (these go into `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`).

### Step 2: Configure Products
1. In the App Dashboard, click **Add Product**.
2. Add **Instagram Graph API**.
3. Add **Facebook Login for Business**.

### Step 3: Create the Config ID (`INSTAGRAM_CONFIG_ID`)
This is the modern way Meta handles business logins. You must create a configuration file inside the Meta Dashboard.
1. Go to **Facebook Login for Business** -> **Configurations**.
2. Click **Create Configuration**.
3. Name it (e.g., `Sparta Content Engine`).
4. **Permissions Required**: 
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
5. Save the configuration. 
6. Meta will provide a **Configuration ID**. Place this into `INSTAGRAM_CONFIG_ID` in your `.env`.

### Step 4: Configure OAuth Settings
1. Go to **Facebook Login for Business** -> **Settings**.
2. Ensure **Valid OAuth Redirect URIs** contains exactly: `http://localhost:3000/api/auth/instagram/callback` (or your production URL).

---

## 🤖 n8n Generation Engine Setup

The platform hides the complex n8n generation from the frontend. 

1. Create a workflow in n8n starting with a **Webhook Node** (Method: `POST`).
2. Add the URL of this node to `n8nWebhook` in the `.env` file.
3. The platform (`/studio/trigger`) will automatically format the request, passing securely isolated project info:
   ```json
   {
     "projectId": "uuid",
     "userId": "uuid",
     "brandName": "Op Sparta",
     "brandVoice": "Aggressive",
     "targetAudience": "Marketers"
   }
   ```
4. Once your AI flow finishes generating an image and caption, ping back the platform webhook (`/api/webhook/generation`):
   ```json
   {
      "projectId": "uuid",
      "userId": "uuid",
      "imageUrl": "https://...",
      "caption": "Your generated caption...",
      "supervisionScore": 95
   }
   ```
   *The content will instantly appear in the Sparta Content Studio inside the user's dashboard.*

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16/17 (App Router)
- **Database**: Supabase + Drizzle ORM
- **UI**: Tailwind CSS + Lucide Icons
- **Auth**: Supabase SSR + Meta Business Login
- **AI Integration**: Global AI Keys + Server Actions
