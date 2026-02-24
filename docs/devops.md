# DevOps and Deployment

## Purpose

Operational guide for deploying and running Legal Copilot as a US-first AI legal SaaS.

This document focuses on architecture and runbook-level guidance, not provider-specific credentials.

---

## 1. Runtime Architecture

### Core services

- Next.js application (API + web)
- PostgreSQL (primary relational store)
- Redis (queues, caching, transient coordination)
- Object storage (S3-compatible)
- Background workers (BullMQ)

### Supporting services

- Observability pipeline (logs, metrics, tracing, errors)
- Secret management and key rotation
- Optional realtime service for websocket/event features

---

## 2. Environments

Use separate environments with isolated data and credentials:

- local
- development
- staging
- production

Rules:

- Never share production secrets with non-production.
- Apply least-privilege IAM/access policy per environment.
- Use immutable infrastructure and repeatable provisioning.

---

## 3. Required Environment Variables

Examples (names may vary by environment tooling):

- `DATABASE_URL`
- `REDIS_URL`
- `BETTER_AUTH_SECRET`
- `OPENROUTER_API_KEY`
- `MINIO_ENDPOINT` (or managed S3 endpoint)
- `MINIO_PORT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_USE_SSL`

Optional integration variables:

- Email, calendar, payment, accounting, e-signature provider credentials
- Error tracking DSN

Secrets policy:

- Store only in secret manager or deployment platform encrypted env store.
- Never commit secrets into repo.

---

## 4. Local Development

### Bootstrap

```bash
npm install
docker compose up -d
npm run db:push
npm run dev
```

### Useful commands

```bash
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e:browser
```

---

## 5. CI/CD Baseline

### Build pipeline

1. Install dependencies
2. Lint/type checks
3. Unit tests
4. Integration tests
5. Build artifact
6. Deploy to staging
7. Smoke tests
8. Promote to production

### Deployment strategy

- Prefer rolling or blue/green deployment.
- Feature-flag high-impact changes (especially AI pipeline and workflow logic).
- Use database migrations with rollback plan.

---

## 6. Database and Migration Operations

### Development

```bash
npm run db:push
```

### Migration workflows

```bash
npm run db:generate
npm run db:migrate
```

Guidelines:

- Back up production before structural migrations.
- Validate migration idempotence in staging.
- Avoid destructive data operations without explicit migration windows.

---

## 7. Queue and Worker Operations

- Run BullMQ workers as first-class production workloads.
- Set retry policies and dead-letter handling.
- Track queue depth, job age, and failure rates.

Operational alerting should include:

- queue latency threshold breaches
- repeated worker crashes
- dead-letter growth

---

## 8. Observability and Incident Response

### Minimum telemetry

- Request latency and error rates by endpoint
- Queue latency/failure metrics
- Integration provider health
- AI usage and failure telemetry

### Incident readiness

- On-call escalation path
- Severity levels and response targets
- Runbooks for auth, storage, db, queue, and provider outages
- Post-incident review template

---

## 9. Security Baseline

- TLS everywhere
- Encryption at rest for data stores
- Least-privilege access controls
- Tenant isolation tests in CI
- Audit logs for sensitive actions
- Periodic secret rotation

For compliance posture, target SOC 2-aligned controls and jurisdiction-aware legal data handling policies.

---

## 10. Production Readiness Checklist

Before enabling new major domain features (for example taxonomy/pipeline):

- Schema migrations reviewed and tested
- Feature flags in place
- Monitoring dashboards and alerts added
- Rollback procedures documented
- Performance smoke test passed
- Security review completed

---

## 11. Notes on Domains and Regions

- Use US-oriented production domain and branding for customer-facing services.
- Choose cloud regions aligned with customer and contractual requirements.
- Document data residency commitments in customer-facing policy docs.
