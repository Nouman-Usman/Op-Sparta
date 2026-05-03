import { pgTable, text, timestamp, uniqueIndex, varchar, boolean, jsonb } from "drizzle-orm/pg-core";

// 1. Your users table (synced with Supabase Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
  n8nGenerationWebhook: text('n8n_generation_webhook'),
  instagramAppId: text('instagram_app_id'),
  instagramAppSecret: text('instagram_app_secret'),
  instagramAccessToken: text('instagram_access_token'),
  instagramPageId: text('instagram_page_id'),
  timezone: text('timezone'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Our secure AI Keys table
export const aiKeys = pgTable("ai_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  config: jsonb("config").$type<{
    defaultModel: string;
    enabledModels: string[];
  }>(),
  encryptedKey: text("encrypted_key").notNull(),
  iv: text("iv").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_provider_idx").on(table.userId, table.provider),
]);
// 3. Projects (Campaigns/Brands)
export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  industry: text('industry'),
  productDesc: text('product_desc'),
  brandVoice: text('brand_voice'),
  brandColor: text('brand_color'),
  productUrl: text('product_url'),
  productImage: text('product_image'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Posts (The generated assets)
export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id'),
  userId: text('user_id').notNull(),
  source: text('source').default('studio').notNull(),
  hashtags: text('hashtags').array(),
  targetTimezone: text('target_timezone'),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  caption: text('caption'),
  status: text('status').default('generating').notNull(),
  supervisionScore: text('supervision_score'),
  metrics: jsonb('metrics').$type<{
    likes: number;
    comments: number;
    reach: number;
    engagement: number;
  }>(),
  instagramPostId: text('instagram_post_id'),
  instagramPermalink: text('instagram_permalink'),
  scheduledFor: timestamp('scheduled_for'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Prompts (Version tracking and prompt storage)
export const prompts = pgTable('prompts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text('post_id').notNull(),
  projectId: text('project_id').notNull(),
  userId: text('user_id').notNull(),
  prompt: text('prompt').notNull(),
  version: text('version').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("prompt_post_version_idx").on(table.postId, table.version),
  uniqueIndex("prompt_post_created_idx").on(table.postId, table.createdAt),
]);
