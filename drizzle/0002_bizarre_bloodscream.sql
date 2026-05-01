ALTER TABLE "posts" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "source" text DEFAULT 'studio' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "hashtags" text[];--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "target_timezone" text;