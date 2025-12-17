-- Semantic Search - pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- Convert document_chunks.embedding from JSONB -> vector(1536).
-- For MVP safety we reset existing embeddings to NULL; re-embed via background job/path when needed.
ALTER TABLE "document_chunks"
  ALTER COLUMN "embedding" TYPE vector(1536)
  USING NULL;

-- Vector similarity index (cosine distance)
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_ivfflat_idx"
  ON "document_chunks" USING ivfflat ("embedding" vector_cosine_ops);

