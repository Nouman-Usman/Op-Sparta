CREATE TABLE "ai_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"config" jsonb,
	"encrypted_key" text NOT NULL,
	"iv" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"image_url" text,
	"caption" text,
	"status" text DEFAULT 'generating' NOT NULL,
	"supervision_score" text,
	"instagram_post_id" text,
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"product_desc" text,
	"brand_voice" text,
	"brand_color" text,
	"product_url" text,
	"product_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text,
	"phone" varchar(256),
	"n8n_generation_webhook" text,
	"instagram_app_id" text,
	"instagram_app_secret" text,
	"instagram_access_token" text,
	"instagram_page_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_provider_idx" ON "ai_keys" USING btree ("user_id","provider");