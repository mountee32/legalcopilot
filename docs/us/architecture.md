# US Target Architecture

## Summary

Use the existing multi-tenant platform as the base and add a configurable intelligence layer for US legal practice operations.

## Core Runtime

- Next.js API + web app
- PostgreSQL + Drizzle
- Redis + BullMQ
- S3-compatible object storage
- OpenRouter + Vercel AI SDK

## New Intelligence Layer

### Taxonomy Domain

- taxonomy packs, categories, fields
- document type classifiers
- reconciliation and action trigger rules
- prompt templates and versioning

### Pipeline Domain

- pipeline runs
- pipeline findings
- pipeline actions

Stages:

1. Intake and validation
2. OCR/text extraction
3. Classification
4. Field extraction
5. Reconciliation
6. Action generation

## Safety and Governance

- Policy modes by action type: auto / approve / forbidden
- Confidence thresholds per field and action
- Required provenance: source quote, page reference, confidence
- Full audit trail for all AI and human decisions

## Data Contracts

- Contract-first API changes via Zod schemas
- Regenerate OpenAPI after schema updates
- Backward compatibility preference during migration phases

## Rollout Strategy

- Feature flags for pipeline and pack rollout
- Pilot firms by cohort
- State overlays released incrementally after eval gates pass
