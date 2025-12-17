-- Calendar events enums
DO $$ BEGIN
  CREATE TYPE calendar_event_type AS ENUM (
    'hearing',
    'deadline',
    'meeting',
    'reminder',
    'limitation_date',
    'filing_deadline',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE calendar_event_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE calendar_event_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Calendar events table
CREATE TABLE IF NOT EXISTS "calendar_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "firm_id" uuid NOT NULL,
  "matter_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "event_type" "calendar_event_type" NOT NULL,
  "status" "calendar_event_status" DEFAULT 'scheduled' NOT NULL,
  "priority" "calendar_event_priority" DEFAULT 'medium' NOT NULL,
  "start_at" timestamp NOT NULL,
  "end_at" timestamp,
  "all_day" boolean DEFAULT false NOT NULL,
  "location" text,
  "attendees" jsonb,
  "reminder_minutes" jsonb,
  "recurrence" jsonb,
  "created_by_id" uuid,
  "external_id" text,
  "external_source" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "calendar_events"
  ADD CONSTRAINT "calendar_events_firm_id_firms_id_fk"
  FOREIGN KEY ("firm_id") REFERENCES "public"."firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "calendar_events"
  ADD CONSTRAINT "calendar_events_matter_id_matters_id_fk"
  FOREIGN KEY ("matter_id") REFERENCES "public"."matters"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "calendar_events"
  ADD CONSTRAINT "calendar_events_created_by_id_users_id_fk"
  FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "calendar_events_firm_start_at_idx" ON "calendar_events" ("firm_id", "start_at");
CREATE INDEX IF NOT EXISTS "calendar_events_firm_matter_idx" ON "calendar_events" ("firm_id", "matter_id");

-- Timeline enum additions for calendar
DO $$ BEGIN
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'calendar_event_created';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'calendar_event_updated';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'calendar_event_deleted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

