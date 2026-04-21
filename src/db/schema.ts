import { pgTable, text, timestamp, uniqueIndex, varchar, boolean, jsonb } from "drizzle-orm/pg-core";

// 1. Your users table (synced with Supabase Auth)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
  n8nGenerationWebhook: text('n8n_generation_webhook'),
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
