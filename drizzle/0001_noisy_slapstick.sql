CREATE TABLE "prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"prompt" text NOT NULL,
	"version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "metrics" jsonb;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "instagram_permalink" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_post_version_idx" ON "prompts" USING btree ("post_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_post_created_idx" ON "prompts" USING btree ("post_id","created_at");