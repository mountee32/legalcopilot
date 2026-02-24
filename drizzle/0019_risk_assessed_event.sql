-- Sprint 10: Add risk_assessed timeline event type
ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'risk_assessed';
