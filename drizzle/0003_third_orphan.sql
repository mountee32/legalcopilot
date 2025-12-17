CREATE TYPE "public"."timeline_actor_type" AS ENUM('user', 'system', 'ai');--> statement-breakpoint
CREATE TYPE "public"."timeline_event_type" AS ENUM('matter_created', 'matter_updated', 'matter_archived', 'document_uploaded', 'document_chunked', 'approval_decided', 'note_added');--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_id" uuid NOT NULL,
	"matter_id" uuid NOT NULL,
	"type" timeline_event_type NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"actor_type" timeline_actor_type NOT NULL,
	"actor_id" uuid,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_firm_id_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_matter_id_matters_id_fk" FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "timeline_events_firm_matter_idx" ON "timeline_events" USING btree ("firm_id","matter_id");--> statement-breakpoint
CREATE INDEX "timeline_events_firm_occurred_at_idx" ON "timeline_events" USING btree ("firm_id","occurred_at");