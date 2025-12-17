# Legal Copilot — Agent Instructions

## Project Overview

Legal Copilot is an AI-first practice management platform for UK law firms. The AI handles 80% of administrative work autonomously — fee earners review and approve, not draft and chase.

---

## Key Documents

| Document                                         | Description                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| [docs/ideas.md](docs/ideas.md)                   | Product specification with 25 epics, user stories, competitive analysis |
| [docs/backend-design.md](docs/backend-design.md) | Data models, API specifications, database schema                        |
| [README.md](README.md)                           | Project setup and getting started guide                                 |
| [SETUP.md](SETUP.md)                             | Detailed environment setup instructions                                 |

---

## Technology Stack

### Runtime & Framework

| Technology     | Version | Purpose                                |
| -------------- | ------- | -------------------------------------- |
| **Node.js**    | 22.x    | JavaScript runtime                     |
| **npm**        | latest  | Package manager (current repo scripts) |
| **Next.js**    | 15.x    | React framework with App Router        |
| **TypeScript** | 5.x     | Type-safe JavaScript                   |
| **React**      | 19.x    | UI library                             |

### Database & Storage

| Technology      | Purpose                         |
| --------------- | ------------------------------- |
| **PostgreSQL**  | Primary database                |
| **Drizzle ORM** | Type-safe database queries      |
| **pgvector**    | Vector embeddings for AI search |
| **Redis**       | Caching and session storage     |
| **MinIO**       | S3-compatible file storage      |

### AI & Processing

| Technology        | Purpose                                      |
| ----------------- | -------------------------------------------- |
| **OpenRouter**    | Multi-model AI gateway (GPT-4, Claude, etc.) |
| **BullMQ**        | Background job processing                    |
| **Vercel AI SDK** | AI streaming and utilities                   |

### Authentication & Security

| Technology      | Purpose                           |
| --------------- | --------------------------------- |
| **Better-Auth** | Authentication library            |
| **Magic Links** | Passwordless client portal access |

### Monitoring & Observability

| Technology | Purpose                                   |
| ---------- | ----------------------------------------- |
| **Sentry** | Error tracking and performance monitoring |

### UI & Styling

| Technology       | Purpose                            |
| ---------------- | ---------------------------------- |
| **Tailwind CSS** | Utility-first CSS framework        |
| **shadcn/ui**    | Component library (Radix UI based) |
| **Lucide React** | Icon library                       |

### Testing

| Technology          | Purpose                      |
| ------------------- | ---------------------------- |
| **Vitest**          | Unit and integration testing |
| **Playwright**      | End-to-end testing           |
| **Testing Library** | React component testing      |

### DevOps & Deployment

| Technology         | Purpose                        |
| ------------------ | ------------------------------ |
| **Docker**         | Containerisation               |
| **Docker Compose** | Local development environment  |
| **Husky**          | Git hooks (pre-commit linting) |
| **Prettier**       | Code formatting                |
| **ESLint**         | Code linting                   |

---

## Project Structure

```
/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Shared utilities and services
│   ├── ai/               # AI/OpenRouter integration
│   ├── auth/             # Authentication
│   ├── db/               # Database (Drizzle schema)
│   ├── queue/            # BullMQ job processing
│   └── storage/          # MinIO file storage
├── middleware/            # API middleware (auth, logging, rate limiting)
├── docs/                  # Documentation
│   ├── ideas.md          # Product specification
│   └── backend-design.md # Technical design
├── backlog/              # Kanban backlog items
│   ├── waiting/
│   ├── design/
│   ├── dev/
│   ├── qa/
│   ├── done/
│   └── parked/
├── .claude/commands/     # Claude Code slash commands
│   ├── design.md         # /design agent
│   ├── dev.md            # /dev agent
│   └── qa.md             # /qa agent
└── tests/                # All test files
    ├── unit/             # Vitest unit tests (mocked)
    ├── integration/      # Vitest integration tests (real DB)
    ├── e2e/              # Playwright tests
    │   ├── api/          # API scenario tests
    │   └── browser/      # Browser UI tests
    ├── fixtures/         # Test data factories & seed
    └── helpers/          # Shared test utilities
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Docker services (PostgreSQL, Redis, MinIO)
docker compose up -d

# Run tests
npm test                  # Unit tests (Vitest)
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only (real DB)
npm run test:e2e          # All Playwright tests
npm run test:e2e:api      # API scenario tests only
npm run test:e2e:browser  # Browser tests only
npm run test:seed         # Seed realistic test data
npm run test:all          # Run everything

# Database
npm run db:push           # Push schema to database
npm run db:studio         # Open Drizzle Studio

# Linting & Formatting
npm run lint              # Run ESLint
npm run format            # Run Prettier
```

---

## AI Model Selection

| Task Type                                    | Model                  | Rationale                      |
| -------------------------------------------- | ---------------------- | ------------------------------ |
| Complex drafting (emails, documents)         | GPT-4 / Claude Opus    | High quality output required   |
| Case analysis & reasoning                    | GPT-4 / Claude Opus    | Complex multi-step reasoning   |
| Classification (email intent, document type) | GPT-3.5 / Claude Haiku | Fast, cost-effective           |
| Entity extraction                            | GPT-3.5 / Claude Haiku | Structured output, high volume |
| Embeddings                                   | text-embedding-3-small | Vector search                  |

---

## Coding Standards

1. **TypeScript**: All code must be TypeScript with strict mode
2. **API Design**: RESTful APIs following patterns in `docs/backend-design.md`
3. **Database**: Use Drizzle ORM, follow schemas in `lib/db/schema/` (re-exported via `lib/db/schema/index.ts`)
4. **Components**: Use shadcn/ui patterns, Tailwind for styling
5. **Testing**: Unit tests for utilities, integration tests for API flows, E2E for critical scenarios
6. **AI Integration**: All AI actions must be logged and auditable

---

## Testing

All tests live under the `tests/` directory with a layered structure.

### Current Coverage (353+ tests)

| Category          | Tests | Status                            |
| ----------------- | ----- | --------------------------------- |
| Unit tests        | 353   | All passing                       |
| Integration tests | 53    | 50 passing (3 auth config issues) |
| E2E browser tests | 20    | 17 passing (3 selector issues)    |
| E2E API tests     | 10    | Blocked by auth UUID issue        |

### Test Structure

| Directory            | Tool       | Purpose                              | Database |
| -------------------- | ---------- | ------------------------------------ | -------- |
| `tests/unit/`        | Vitest     | Fast, isolated unit tests with mocks | Mocked   |
| `tests/integration/` | Vitest     | API tests against real database      | Real     |
| `tests/e2e/api/`     | Playwright | Multi-step API scenario tests        | Real     |
| `tests/e2e/browser/` | Playwright | Full browser UI tests                | Real     |

### Test Coverage by Domain

| Domain              | Unit                                                                                         | Integration                                                                                 | E2E                                      |
| ------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Auth/RBAC**       | `middleware/withAuth.test.ts`                                                                | `auth/session.test.ts`, `auth/rbac.test.ts`                                                 | -                                        |
| **Database**        | -                                                                                            | `db/constraints.test.ts`, `db/transactions.test.ts`, `db/queries.test.ts`                   | -                                        |
| **Storage (MinIO)** | `lib/storage/minio.test.ts`                                                                  | `storage/upload-download.test.ts`, `storage/presigned-urls.test.ts`                         | `journey-demo-storage.spec.ts`           |
| **Queue (BullMQ)**  | `lib/queue/jobs.test.ts`                                                                     | `queue/processing.test.ts`, `queue/retry.test.ts`                                           | -                                        |
| **AI/OpenRouter**   | `lib/ai/openrouter.test.ts`, `lib/documents/*.test.ts`                                       | -                                                                                           | -                                        |
| **Webhooks**        | -                                                                                            | `webhooks/stripe.test.ts`, `webhooks/gocardless.test.ts`, `webhooks/email-provider.test.ts` | -                                        |
| **Calendar Sync**   | -                                                                                            | `sync/google-calendar.test.ts`, `sync/outlook-calendar.test.ts`                             | -                                        |
| **Accounting Sync** | -                                                                                            | `sync/xero.test.ts`                                                                         | -                                        |
| **Edge Cases**      | `edge-cases/security.test.ts`, `edge-cases/money.test.ts`, `edge-cases/empty-states.test.ts` | -                                                                                           | -                                        |
| **Demo Pages**      | -                                                                                            | -                                                                                           | `demo.spec.ts`, `journey-demo-*.spec.ts` |

### Writing Tests

**Unit tests** (`tests/unit/`): Mock external dependencies, test single functions/components.

```typescript
// tests/unit/lib/example.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db"); // Mock database

describe("myFunction", () => {
  it("should do something", () => {
    expect(myFunction()).toBe(expected);
  });
});
```

**Integration tests** (`tests/integration/`): Use real database with test fixtures.

```typescript
// tests/integration/clients.test.ts
import { describe, it, expect } from "vitest";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createClient } from "@tests/fixtures/factories";

describe("Client API", () => {
  const ctx = setupIntegrationSuite(); // Creates test firm, cleans up after

  it("should create a client", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    expect(client.id).toBeDefined();
  });
});
```

**API E2E tests** (`tests/e2e/api/`): Test complete API workflows.

```typescript
// tests/e2e/api/billing-workflow.spec.ts
import { test, expect } from "@playwright/test";

test("complete billing flow", async ({ request }) => {
  // Create client → Add matter → Log time → Generate invoice
  const client = await request.post("/api/clients", { data: {...} });
  expect(client.ok()).toBeTruthy();
  // ...continue workflow
});
```

### Test Utilities

| Location                      | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `tests/helpers/db.ts`         | Database setup, cleanup, reset                      |
| `tests/helpers/auth.ts`       | Test authentication, get tokens                     |
| `tests/helpers/assertions.ts` | Custom assertions (expectSuccess, expectUUID, etc.) |
| `tests/fixtures/factories/`   | Create test entities (firm, client, matter)         |
| `tests/fixtures/seed.ts`      | Seed realistic dataset for manual testing           |

### Test Data Factories

Use factories to create test data consistently:

```typescript
import { createFirm, createClient, createMatter } from "@tests/fixtures/factories";

const firm = await createFirm({ plan: "enterprise" });
const client = await createClient({ firmId: firm.id, type: "company" });
const matter = await createMatter({ firmId: firm.id, clientId: client.id });
```

### Running Tests

```bash
# Unit tests (no dependencies required)
npm run test:unit         # Fast, mocked - always run first

# Integration tests (requires Docker services)
docker compose up -d      # Start PostgreSQL, Redis, MinIO
npm run db:push           # Ensure schema is current
npm run test:integration  # Tests against real database

# E2E tests (requires Docker services + dev server)
docker compose up -d
npm run test:e2e:browser  # Browser UI tests (Chromium)
npm run test:e2e:api      # API workflow tests

# Combined commands
npm test                  # All Vitest tests (unit + integration)
npm run test:all          # Everything (Vitest + Playwright)
npm run test:seed         # Seed realistic test data for manual testing
```

### Prerequisites

| Test Type   | Docker | Database   | Dev Server         |
| ----------- | ------ | ---------- | ------------------ |
| Unit        | No     | No         | No                 |
| Integration | Yes    | Yes (real) | No                 |
| E2E Browser | Yes    | Yes (real) | Yes (auto-started) |
| E2E API     | Yes    | Yes (real) | Yes (auto-started) |

### Test Database Strategy

Tests use **tenant isolation**: each test suite creates its own test firm and cleans up after. This allows parallel test execution without conflicts.

---

## Backlog Workflow

Use the Kanban board (VS Code extension) to manage work:

1. **waiting/** — Triaged items ready for work
2. **design/** — Items being analysed (use `/design` command)
3. **dev/** — Items being implemented (use `/dev` command)
4. **qa/** — Items being tested (use `/qa` command)
5. **done/** — Completed items
6. **parked/** — Deferred items

File naming: `{TYPE}-{description}.md` where TYPE is BUG, FEAT, TASK, SEC, or PLAN.

## Quick Reference

- **Product Spec**: [docs/ideas.md](docs/ideas.md) — 25 epics, user stories, competitive analysis
- **Backend Design**: [docs/backend-design.md](docs/backend-design.md) — Data models, APIs, database schema
- **Tech Stack**: Node.js + npm, Next.js 15, TypeScript, PostgreSQL, Redis, OpenRouter

## Key Principles

1. **AI-First**: Legal Copilot does the work, humans approve
2. **UK-Focused**: SRA compliance, UK terminology, UK integrations
3. **Audit Everything**: All AI actions logged and explainable
4. **Human Override**: Users can always override AI suggestions

## Code Reference

When building features, consult these locations directly:

| Need              | Location                                                     |
| ----------------- | ------------------------------------------------------------ |
| What to build     | `docs/ideas.md` — epics & user stories                       |
| Architecture      | `docs/backend-design.md` — data models, API design           |
| Database schema   | `lib/db/schema/*.ts` — read files directly for current state |
| API validation    | `lib/api/schemas/*.ts` — Zod schemas with OpenAPI            |
| Existing patterns | `app/api/demo/` — reference implementation                   |
| Test utilities    | `tests/fixtures/factories/` — test data factories            |
| Test examples     | `tests/unit/app/api/demo/` — reference test patterns         |

### Schema Structure

Database schemas are split by domain (read these directly):

- `lib/db/schema/users.ts` — User, Session, Account
- `lib/db/schema/clients.ts` — Client management
- `lib/db/schema/matters.ts` — Matter/case management
- `lib/db/schema/documents.ts` — Document storage
- `lib/db/schema/billing.ts` — Time entries, invoices, payments
- `lib/db/schema/audit.ts` — Audit logging

Each schema file is self-documenting with JSDoc comments. Read these files to understand the current data model.
