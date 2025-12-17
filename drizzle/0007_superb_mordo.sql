CREATE TYPE "public"."email_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."email_intent" AS ENUM('request_information', 'provide_information', 'request_action', 'status_update', 'complaint', 'deadline', 'confirmation', 'general');--> statement-breakpoint
CREATE TYPE "public"."email_sentiment" AS ENUM('positive', 'neutral', 'negative', 'frustrated');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('draft', 'pending', 'sent', 'delivered', 'received', 'failed', 'bounced', 'archived');--> statement-breakpoint
ALTER TYPE "public"."timeline_event_type" ADD VALUE 'email_received' BEFORE 'task_created';--> statement-breakpoint
ALTER TYPE "public"."timeline_event_type" ADD VALUE 'email_sent' BEFORE 'task_created';--> statement-breakpoint
CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"matter_id" uuid,
	"direction" "email_direction" NOT NULL,
	"from_address" jsonb NOT NULL,
	"to_addresses" jsonb NOT NULL,
	"cc_addresses" jsonb,
	"bcc_addresses" jsonb,
	"subject" text NOT NULL,
	"body_text" text,
	"body_html" text,
	"message_id" text,
	"thread_id" text,
	"in_reply_to" text,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"attachment_count" integer DEFAULT 0 NOT NULL,
	"attachment_ids" jsonb,
	"status" "email_status" DEFAULT 'received' NOT NULL,
	"read_at" timestamp,
	"ai_processed" boolean DEFAULT false NOT NULL,
	"ai_processed_at" timestamp,
	"ai_intent" "email_intent",
	"ai_sentiment" "email_sentiment",
	"ai_urgency" integer,
	"ai_summary" text,
	"ai_suggested_response" text,
	"ai_suggested_tasks" jsonb,
	"ai_matched_matter_id" uuid,
	"ai_match_confidence" integer,
	"created_by" uuid,
	"received_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_ai_matched_matter_id_matters_id_fk" FOREIGN KEY ("ai_matched_matter_id") REFERENCES "public"."matters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emails_firm_matter_idx" ON "emails" USING btree ("firm_id","matter_id");--> statement-breakpoint
CREATE INDEX "emails_firm_status_idx" ON "emails" USING btree ("firm_id","status");--> statement-breakpoint
CREATE INDEX "emails_firm_direction_idx" ON "emails" USING btree ("firm_id","direction");--> statement-breakpoint
CREATE INDEX "emails_thread_idx" ON "emails" USING btree ("thread_id");