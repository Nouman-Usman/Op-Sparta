ALTER TABLE "posts" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "schedule_slots" jsonb;