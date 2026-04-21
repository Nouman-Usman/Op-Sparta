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
  targetAudience: text('target_audience'),
  brandVoice: text('brand_voice'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Posts (The generated assets)
export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull(),
  userId: text('user_id').notNull(),
  imageUrl: text('image_url'),
  caption: text('caption'),
  status: text('status').default('generating').notNull(), // generating, pending, approved, published, failed
  supervisionScore: text('supervision_score'),
  instagramPostId: text('instagram_post_id'),
  scheduledFor: timestamp('scheduled_for'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
