# Semantic Search - pgvector Implementation

## Priority: LOW (Phase 2)

## Summary

Upgrade document chunks to use pgvector for semantic similarity search instead of JSONB.

## Requirements

- Enable pgvector extension
- Generate embeddings for document chunks
- Semantic search across documents
- Similar document finding

## Scope

### Database Changes

- Enable pgvector: `CREATE EXTENSION vector;`
- Change `documentChunks.embedding` from JSONB to `vector(1536)`
- Add index: `CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)`

### Embedding Generation (`lib/ai/embeddings.ts`)

- Use OpenAI embeddings or similar
- Generate on document chunk creation
- Batch processing for existing documents

### Search API

- `POST /api/search/semantic` - Semantic search across all documents
- `GET /api/matters/[id]/search` - Search within matter documents

### Integration with RAG

- Update `/api/matters/[id]/ai/ask` to use vector similarity

## Design

### PostgreSQL-First, Minimal Migration

- Enable pgvector (`CREATE EXTENSION IF NOT EXISTS vector`) via migrations.
- Migrate `document_chunks.embedding` from JSONB to `vector(N)` once the embedding model dimension is chosen; keep a re-embedding job path for strategy changes.

### Data Flow

- On chunk creation/re-chunking, generate embeddings and store per chunk.
- Semantic search queries return the top K matching chunks scoped to firm (and optionally matter) with similarity scores + chunk metadata for citations.

### API Shape

- Add `POST /api/search/semantic` (firm-wide) and `GET /api/matters/[id]/search` (matter-scoped) endpoints.
- Update `/api/matters/[id]/ai/ask` to select sources by vector similarity first, then prompt the model to return citations (`documentId` + `documentChunkId`).

### Performance (no premature optimisation)

- Start with small K (e.g. 8–20) and a single ivfflat index; only tune lists/probes after measuring.

## Dependencies

- Document chunking (already complete)
- PostgreSQL with pgvector support

## References

- docs/backend-design.md AI Integration section
