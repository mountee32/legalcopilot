DO $$ BEGIN
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'document_extracted';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'document_summarized';
  ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'document_entities_extracted';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

