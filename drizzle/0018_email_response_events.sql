-- Sprint 9: Email response workflow timeline event types
ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'email_response_generated';
ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'email_tasks_created';
ALTER TYPE timeline_event_type ADD VALUE IF NOT EXISTS 'email_delivery_failed';
