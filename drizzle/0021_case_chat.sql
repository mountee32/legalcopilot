-- Case Chat: conversation history for AI case assistant
-- Tables created via db:push (Drizzle), this migration handles the enum and timeline event type

CREATE TYPE "case_message_role" AS ENUM ('user', 'assistant');

ALTER TYPE "timeline_event_type" ADD VALUE IF NOT EXISTS 'ai_chat_started';
