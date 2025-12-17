DO $$ BEGIN
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'time_entry_submitted';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'time_entry_approved';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'invoice_generated';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'invoice_sent';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'invoice_voided';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'payment_recorded';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'payment_deleted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

