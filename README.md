# 🛡️ Operation Sparta

Operation Sparta is a high-fidelity AI supervision engine designed for seamless content generation and automated social publishing. 

## 🚀 Getting Started

### 1. Prerequisites
- **Supabase**: Database and Authentication.
- **n8n**: Content Generation Engine.
- **Meta Developer Account**: For Direct Instagram Posting.

### 2. Environment Setup
Create a `.env` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
ENCRYPTION_KEY= # 32-char string for AI Key security
```

---

## 📸 Exhaustive Meta & Instagram API Guide

Direct posting to Instagram is a multi-step process. Follow these exact steps to obtain your **Page ID** and **Long-Lived Access Token**.

### Step 1: Account Preparation
Before touching the developer portal, ensure:
1. Your Instagram Account is a **Professional/Business** account.
2. You have a **Facebook Page**.
3. Your Instagram Account is **linked** to that Facebook Page (Found in Instagram Mobile App: `Edit Profile` -> `Page`).

### Step 2: Create a Meta App
1. Visit [Meta for Developers](https://developers.facebook.com/).
2. Click **My Apps** -> **Create App**.
3. Select **Other** -> **Business** (Critical: "Business" apps have the required API scopes).
4. Give it a name (e.g., `Sparta-Auto-Post`).

### Step 3: Configure Products
1. In the App Dashboard, click **Add Product** in the sidebar.
2. Add **Instagram Graph API**.
3. Add **Facebook Login for Business**.

### Step 4: Identify your Instagram Business ID
Meta uses a specific ID for the Instagram portion of your page.
1. Open the [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App in the top right.
3. In the "User or Page" dropdown, select **Get Page Access Token**.
4. Run this query:
   `GET v18.0/me/accounts?fields=name,id,instagram_business_account`
5. Look for the `instagram_business_account` object.
6. **The `id` inside that object is your Instagram Page ID** for Sparta.

### Step 5: Generate the Correct Access Token
1. In the Graph API Explorer, ensures these **exact permissions** are selected:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `ads_management`
2. Click **Generate Token**.
3. Follow the popup to log in and select your specific Page and IG Account.

### Step 6: Convert to Long-Lived Token (60 Days)
The token from Step 5 expires in 1-2 hours. You need to "exchange" it:
1. Copy the token from the Explorer.
2. Go to the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/).
3. Paste the token and click **Debug**.
4. Click **Extend Access Token** at the bottom.
5. Meta will generate a new token. Click **Copy** (or click "Debug" on that new token to see it).
6. This 60-day token is what you paste into **Sparta Settings**.

### Step 7: For Permanent Tokens (Advanced)
If you don't want to re-link every 60 days, you must create a **System User** in [Meta Business Suite](https://business.facebook.com/settings/system-users):
1. Create a System User.
2. Click **Add Assets** to give the user access to your Facebook Page.
3. Click **Generate New Token**.
4. Select the permissions from Step 5.
5. This token **never expires**.

---

## 🤖 n8n Generation Engine
1. Create a workflow in n8n starting with a **Webhook Node** (Method: `POST`).
2. Point the Webhook URL in Sparta Settings to this node.
3. Your n8n workflow should receive the data, run your AI nodes, and return a JSON payload matching our schema:
   ```json
   {
     "caption": "...",
     "headline": "...",
     "imagePrompt": "...",
     "hashtags": ["...", "..."],
     "supervisionScore": 10
   }
   ```

---

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase + Drizzle ORM
- **UI**: Tailwind CSS + Lucide Icons
- **Auth**: Supabase SSR
- **AI**: Vercel AI SDK + Google Gemini / OpenAI
