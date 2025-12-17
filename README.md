# Template Project

A production-ready full-stack template with Next.js 15, React 19, and a comprehensive suite of modern technologies. Perfect for quickly starting new projects with all essential services pre-configured.

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with server components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components

### Backend & Data

- **PostgreSQL** - Relational database (containerized)
- **Drizzle ORM** - Type-safe SQL ORM
- **Redis** - In-memory data store for caching and sessions
- **BullMQ** - Background job processing with Redis

### Storage & Files

- **MinIO** - S3-compatible object storage (self-hosted)

### Authentication

- **Better Auth** - Modern authentication with database integration
- Email/Password authentication
- OAuth support (Google, GitHub)

### AI Integration

- **Vercel AI SDK** - Stream-ready AI integration
- **OpenRouter** - Access to 100+ AI models

### Observability

- **Dozzle** - Real-time Docker log viewer
- **Sentry** - Error tracking and monitoring

### Validation

- **Zod** - TypeScript-first schema validation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone and Install

```bash
# Clone this template
git clone <your-repo-url> my-new-project
cd my-new-project

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment example
cp .env.example .env

# Edit .env with your configuration
# At minimum, update:
# - DATABASE_URL
# - BETTER_AUTH_SECRET (generate with: openssl rand -base64 32)
```

### 3. Start Services

```bash
# Start all Docker services (PostgreSQL, Redis, MinIO, Dozzle)
docker compose up -d

# Verify services are running
docker compose ps
```

### 4. Database Setup

```bash
# Push database schema to PostgreSQL
npm run db:push

# Or generate and run migrations
npm run db:generate
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Visit:

- **App**: http://localhost:3000
- **Demo Dashboard**: http://localhost:3000/demo
- **Bull Board (Queue Monitoring)**: http://localhost:3000/api/bull-board
- **Monitoring Dashboard**: http://localhost:3000/monitoring
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)
- **Dozzle Logs**: http://localhost:8080

## Project Structure

```
.
├── app/
│   ├── api/              # API routes
│   │   ├── auth/        # Authentication endpoints
│   │   ├── ai/          # AI chat endpoints
│   │   ├── storage/     # File upload endpoints
│   │   ├── jobs/        # Job queue endpoints
│   │   ├── bull-board/  # Bull Board monitoring UI
│   │   └── health/      # Health check endpoint
│   ├── demo/            # Demo dashboard page
│   ├── monitoring/      # Queue monitoring dashboard
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── auth/            # Better Auth configuration
│   ├── ai/              # OpenRouter AI integration
│   ├── db/              # Database schema and connection
│   ├── queue/           # BullMQ job queues
│   ├── storage/         # MinIO storage helpers
│   └── bullboard.ts     # Bull Board configuration
├── docker-compose.yml   # Docker services configuration
├── drizzle.config.ts    # Drizzle ORM configuration
└── .env.example         # Environment variables template
```

## Available Scripts

### Development

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database

```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Run migrations
npm run db:push      # Push schema directly to database (dev)
npm run db:studio    # Open Drizzle Studio (database GUI)
```

### Testing

```bash
npm test                # Run unit tests with Vitest
npm run test:ui         # Open Vitest UI for interactive testing
npm run test:coverage   # Run tests with coverage report
npm run test:e2e        # Run E2E tests with Playwright (headless)
npm run test:e2e:ui     # Open Playwright UI for interactive E2E testing
npm run test:e2e:headed # Run E2E tests in headed mode (see browser)
npm run test:e2e:debug  # Debug E2E tests with Playwright Inspector
```

### Docker

```bash
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f            # Follow logs
docker compose ps                 # List running services
docker compose restart <service>  # Restart specific service
```

## Service Configuration

### PostgreSQL

- **Port**: 5432
- **Database**: template_db
- **User**: postgres
- **Password**: postgres (change in production!)

### Redis

- **Port**: 6379
- Used for sessions, caching, and BullMQ queues

### MinIO

- **API Port**: 9000
- **Console Port**: 9001
- **Access Key**: minioadmin
- **Secret Key**: minioadmin (change in production!)
- **Default Bucket**: uploads

### Dozzle

- **Port**: 8080
- View Docker logs in real-time

## Features & Examples

### Authentication

Better Auth is pre-configured with:

- Email/Password authentication
- Session management with Redis
- OAuth providers (Google, GitHub) - requires API keys

```typescript
// Client-side usage
import { signIn, signOut, useSession } from "@/lib/auth/client";

// Sign in
await signIn.email({ email, password });

// Check session
const { data: session } = useSession();
```

### Database Operations

Drizzle ORM provides type-safe database access:

```typescript
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// Insert user
const [user] = await db
  .insert(users)
  .values({
    email: "user@example.com",
    name: "John Doe",
  })
  .returning();

// Query users
const allUsers = await db.select().from(users);
```

### File Storage

Upload files to MinIO S3-compatible storage:

```typescript
import { uploadFile } from "@/lib/storage/minio";

const result = await uploadFile("uploads", "filename.jpg", buffer, "image/jpeg");
```

Or use the API endpoint:

```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -F "file=@image.jpg"
```

### Background Jobs

Create and process background jobs with BullMQ:

```typescript
import { addEmailJob } from "@/lib/queue";

// Add job to queue
await addEmailJob({
  to: "user@example.com",
  subject: "Welcome!",
  body: "Thanks for signing up",
});
```

### Monitoring

Monitor your BullMQ job queues with Bull Board:

**Access Bull Board Dashboard:**

- **Bull Board UI**: http://localhost:3000/api/bull-board
- **Monitoring Page**: http://localhost:3000/monitoring
- **Demo Page**: http://localhost:3000/demo (see Monitoring tab)

**Features:**

- Real-time queue statistics
- Job inspection and management
- Retry failed jobs
- Pause/resume queues
- Clean completed/failed jobs
- Search and filter jobs

**Adding New Queues to Monitoring:**

1. Create queue in `lib/queue/index.ts`
2. Add queue adapter to `app/api/bull-board/[[...path]]/route.ts`:

```typescript
import { myNewQueue } from "@/lib/queue";

createBullBoard({
  queues: [
    // ... existing queues
    new BullMQAdapter(myNewQueue),
  ],
  serverAdapter,
});
```

### AI Integration

Use OpenRouter for AI features:

```typescript
import { streamAIText } from "@/lib/ai/openrouter";

const result = await streamAIText("Hello, AI!");
```

Or via API:

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, AI!"}'
```

### Health Checks

Monitor service health:

```bash
curl http://localhost:3000/api/health
```

Returns status for PostgreSQL, Redis, and MinIO.

## Middleware Patterns

This template includes comprehensive middleware patterns for API routes, providing reusable solutions for common cross-cutting concerns.

### Available Middleware

#### 1. Authentication Middleware (`withAuth`)

Protects routes by requiring a valid Better Auth session.

```typescript
import { withAuth } from "@/middleware/withAuth";

export const GET = withAuth(async (request, { user }) => {
  // user is guaranteed to be authenticated
  return NextResponse.json({
    message: `Hello ${user.user.name}`,
  });
});
```

Features:

- Checks for valid session before allowing access
- Returns 401 if not authenticated
- Provides user session data to handler
- Optional variant (`withOptionalAuth`) for routes that work with or without auth

#### 2. Request Logging Middleware (`withLogging`)

Logs incoming requests and outgoing responses with structured data.

```typescript
import { withLogging } from "@/middleware/withLogging";

export const GET = withLogging(async (request) => {
  return NextResponse.json({ data: "example" });
});
```

Features:

- Logs method, URL, timestamp
- Logs response status and duration
- Generates request ID for tracing
- Structured JSON logging format
- Optional request/response body logging

Configuration options:

```typescript
export const POST = withLogging(
  async (request) => {
    return NextResponse.json({ success: true });
  },
  {
    logBody: true, // Log request body
    logResponse: true, // Log response body
    jsonFormat: true, // Use JSON format
  }
);
```

#### 3. Error Handling Middleware (`withErrorHandler`)

Catches all errors and returns consistent error responses.

```typescript
import { withErrorHandler, ValidationError } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(async (request) => {
  // Any error thrown here will be caught and formatted
  if (!isValid) {
    throw new ValidationError("Invalid input", { field: "email" });
  }

  return NextResponse.json({ success: true });
});
```

Features:

- Catches all errors in route handlers
- Returns consistent error response format
- Logs errors with stack traces in development
- Sends errors to Sentry if configured
- Hides internal errors in production
- Custom error classes (ValidationError, NotFoundError, etc.)

#### 4. Rate Limiting Middleware (`withRateLimit`)

Limits requests using Redis-based sliding window algorithm.

```typescript
import { withRateLimit, RateLimitPresets } from "@/middleware/withRateLimit";

// Using presets
export const GET = withRateLimit(
  async (request) => {
    return NextResponse.json({ data: "example" });
  },
  RateLimitPresets.api // 100 requests per minute
);

// Custom configuration
export const POST = withRateLimit(
  async (request) => {
    return NextResponse.json({ success: true });
  },
  { max: 5, windowSeconds: 60 } // 5 requests per minute
);
```

Features:

- Redis-based sliding window rate limiting
- Configurable limits and time windows
- IP-based by default
- Custom key generation (user ID, API key, etc.)
- Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- Returns 429 Too Many Requests when exceeded

Available presets:

- `RateLimitPresets.auth` - 5 requests per 15 minutes (for auth endpoints)
- `RateLimitPresets.api` - 100 requests per minute (standard API)
- `RateLimitPresets.readOnly` - 1000 requests per hour (read operations)
- `RateLimitPresets.expensive` - 10 requests per hour (expensive operations)
- `RateLimitPresets.public` - 3 requests per minute (public endpoints)

#### 5. Middleware Composition (`compose`)

Combine multiple middleware into a single middleware stack.

```typescript
import { compose, withAuth, withLogging, withErrorHandler, withRateLimit } from "@/middleware";

// Compose multiple middleware
const middleware = compose(
  withErrorHandler, // Outermost - catches all errors
  withLogging, // Logs all requests
  withRateLimit({ max: 10, windowSeconds: 60 }),
  withAuth // Innermost - checks authentication
);

export const GET = middleware(async (request, { user }) => {
  return NextResponse.json({ message: "Protected and logged" });
});
```

### Composition Helpers

#### `compose()` / `pipe()`

Combine multiple middleware into one:

```typescript
const middleware = compose(withErrorHandler, withLogging, withAuth);
```

#### `when()` - Conditional middleware

Apply middleware only when condition is true:

```typescript
const middleware = compose(
  withErrorHandler,
  when((req) => req.headers.get("X-API-Version") === "v2", withRateLimit({ max: 50 }))
);
```

#### `unless()` - Inverse conditional

Skip middleware when condition is true:

```typescript
const middleware = unless(
  (req) => req.headers.get("X-Internal") === "true",
  withRateLimit({ max: 10 })
);
```

#### `byMethod()` - Method-specific middleware

Apply different middleware based on HTTP method:

```typescript
const middleware = byMethod({
  GET: withRateLimit({ max: 100 }),
  POST: compose(withRateLimit({ max: 10 }), withAuth),
  DELETE: withAuth,
});
```

#### `forRoute()` - Route-specific middleware

Apply middleware only to specific routes:

```typescript
const middleware = forRoute(/\/admin\/.*/, withAuth);
```

### Creating Custom Middleware

Middleware functions follow a simple pattern:

```typescript
import { NextRequest, NextResponse } from "next/server";

type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response> | Response;

export function withCustomMiddleware(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    // Pre-processing logic here
    console.log("Before handler");

    // Execute the handler
    const response = await handler(request, context);

    // Post-processing logic here
    console.log("After handler");

    return response;
  };
}
```

### Common Middleware Patterns

#### Protected API Route

```typescript
import { compose, withErrorHandler, withLogging, withAuth } from "@/middleware";

const protectedRoute = compose(withErrorHandler, withLogging, withAuth);

export const GET = protectedRoute(async (request, { user }) => {
  return NextResponse.json({ data: "protected" });
});
```

#### Public API with Rate Limiting

```typescript
import { compose, withErrorHandler, withLogging, withRateLimit } from "@/middleware";

const publicRoute = compose(
  withErrorHandler,
  withLogging,
  withRateLimit({ max: 100, windowSeconds: 60 })
);

export const GET = publicRoute(async (request) => {
  return NextResponse.json({ data: "public" });
});
```

#### Admin Route with Strict Rate Limiting

```typescript
import {
  compose,
  withErrorHandler,
  withLogging,
  withRateLimit,
  withAuth,
  RateLimitPresets,
} from "@/middleware";

const adminRoute = compose(
  withErrorHandler,
  withLogging,
  withRateLimit(RateLimitPresets.auth),
  withAuth
);

export const DELETE = adminRoute(async (request, { user }) => {
  // Check admin role, etc.
  return NextResponse.json({ success: true });
});
```

### Example Routes

Try the middleware examples:

```bash
# Protected route example
curl http://localhost:3000/api/demo/protected

# Middleware examples
curl http://localhost:3000/api/demo/middleware

# Test error handling
curl "http://localhost:3000/api/demo/middleware?error=validation"

# Test rate limiting (make multiple requests)
for i in {1..11}; do curl http://localhost:3000/api/demo/middleware; done
```

### Best Practices

1. **Order Matters**: Always apply middleware in the correct order:
   - Error handler first (catches everything)
   - Logging second (logs all requests)
   - Rate limiting third
   - Authentication last

2. **Reuse Common Stacks**: Create reusable middleware stacks for common patterns:

   ```typescript
   const protectedRoute = compose(withErrorHandler, withLogging, withAuth);
   ```

3. **Environment-Specific Behavior**: Adjust middleware behavior based on environment:

   ```typescript
   withErrorHandler({
     includeStack: process.env.NODE_ENV === "development",
     sendToSentry: process.env.NODE_ENV === "production",
   });
   ```

4. **Custom Key Generation**: For rate limiting by user instead of IP:
   ```typescript
   withRateLimit({
     keyGenerator: (request) => {
       const userId = request.headers.get("X-User-ID");
       return userId || "anonymous";
     },
   });
   ```

## Environment Variables

Key environment variables to configure:

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `BETTER_AUTH_SECRET` - Secret for auth tokens

### Optional

- `OPENROUTER_API_KEY` - For AI features
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - For GitHub OAuth
- `SENTRY_DSN` - For error tracking
- `RESEND_API_KEY` - For email sending

See `.env.example` for complete list.

## Production Deployment

### Security Checklist

- [ ] Change all default passwords (PostgreSQL, MinIO)
- [ ] Generate new `BETTER_AUTH_SECRET`
- [ ] Configure OAuth credentials
- [ ] Set up Sentry for error tracking
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Review and adjust rate limits

### Deployment Options

**Vercel** (Recommended for Next.js)

- Deploy frontend to Vercel
- Use managed PostgreSQL (Vercel Postgres, Supabase, etc.)
- Use managed Redis (Upstash, Redis Cloud, etc.)
- Deploy MinIO separately or use S3

**Docker** (Self-hosted)

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Extending the Template

### Adding New Database Tables

1. Update `lib/db/schema.ts`:

```typescript
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  // ... more fields
});
```

2. Generate and run migration:

```bash
npm run db:generate
npm run db:migrate
```

### Adding New API Routes

Create files in `app/api/your-route/route.ts`:

```typescript
export async function GET(req: NextRequest) {
  return Response.json({ message: "Hello" });
}
```

### Adding New Background Jobs

1. Define queue in `lib/queue/index.ts`
2. Create worker in `lib/queue/workers.ts`
3. Add job via API or directly in code

## Testing

This template includes a comprehensive testing setup with both unit/integration tests and end-to-end (E2E) tests.

### Testing Stack

- **Vitest** - Fast unit test framework with TypeScript support
- **@testing-library/react** - React component testing utilities
- **Playwright** - Reliable E2E testing framework
- **jsdom** - DOM implementation for Node.js

### Running Tests

#### Unit Tests

Unit tests are located in the `__tests__` directory and use Vitest:

```bash
# Run all unit tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run tests with coverage report
npm run test:coverage

# Open Vitest UI (interactive test runner)
npm run test:ui
```

#### E2E Tests

E2E tests are located in the `e2e` directory and use Playwright:

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run E2E tests with browser visible
npm run test:e2e:headed

# Open Playwright UI for interactive testing
npm run test:e2e:ui

# Debug E2E tests with Playwright Inspector
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- e2e/demo.spec.ts

# Run tests on specific browser
npm run test:e2e -- --project=chromium
```

### Test Examples

#### Unit Test Example

```typescript
// __tests__/lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });
});
```

#### API Route Test Example

```typescript
// __tests__/app/api/demo/users/route.test.ts
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

describe("Users API Route", () => {
  it("should return list of users", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.limit).mockResolvedValue([{ id: "1", email: "test@example.com" }]);

    const { GET } = await import("@/app/api/demo/users/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
  });
});
```

#### E2E Test Example

```typescript
// e2e/demo.spec.ts
import { test, expect } from "@playwright/test";

test("should load the demo page", async ({ page }) => {
  await page.goto("/demo");

  const heading = page.getByRole("heading", {
    name: /Technology Demo Dashboard/i,
  });
  await expect(heading).toBeVisible();
});

test("should switch between tabs", async ({ page }) => {
  await page.goto("/demo");

  const redisTab = page.getByRole("tab", { name: /Redis/i });
  await redisTab.click();

  const redisSectionHeading = page.getByRole("heading", {
    name: /Redis Cache/i,
  });
  await expect(redisSectionHeading).toBeVisible();
});
```

### Writing New Tests

#### Adding Unit Tests

1. Create a test file in the `__tests__` directory matching your source file structure:

   ```
   lib/utils.ts -> __tests__/lib/utils.test.ts
   ```

2. Import your functions and write tests:

   ```typescript
   import { describe, it, expect } from "vitest";
   import { myFunction } from "@/lib/myModule";

   describe("myFunction", () => {
     it("should do something", () => {
       expect(myFunction()).toBe(expected);
     });
   });
   ```

#### Adding E2E Tests

1. Create a test file in the `e2e` directory:

   ```
   e2e/my-feature.spec.ts
   ```

2. Write your test using Playwright:

   ```typescript
   import { test, expect } from "@playwright/test";

   test("my feature works", async ({ page }) => {
     await page.goto("/my-page");
     await page.click("button");
     await expect(page.locator("h1")).toHaveText("Expected");
   });
   ```

### Test Configuration

#### Vitest Configuration

Configuration is in `vitest.config.ts`:

- Uses jsdom for DOM simulation
- Supports TypeScript and path aliases (@/)
- Includes coverage reporting
- Setup file: `vitest.setup.ts`

#### Playwright Configuration

Configuration is in `playwright.config.ts`:

- Tests multiple browsers (Chromium, Firefox, WebKit)
- Tests mobile viewports (Pixel 5, iPhone 12)
- Automatically starts dev server before tests
- Captures screenshots and videos on failure
- Base URL: http://localhost:3000

### CI/CD Integration

For continuous integration, add these commands to your CI pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run unit tests
  run: npm test

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```

### Test Coverage

Generate a test coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in:

- `coverage/` - HTML and JSON reports
- View the HTML report by opening `coverage/index.html`

### Best Practices

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test how modules work together
3. **E2E Tests**: Test critical user flows and features
4. **Mock External Services**: Use mocks for database, API calls, etc.
5. **Keep Tests Fast**: Unit tests should run in milliseconds
6. **Use Descriptive Names**: Test names should describe what they test
7. **Test Edge Cases**: Include tests for error conditions and edge cases

## Code Quality

This template includes comprehensive code quality tools to maintain consistent code style and catch errors before they reach production.

### Tools Included

- **Prettier** - Automatic code formatting
- **ESLint** - Code linting and error detection
- **Husky** - Git hooks to enforce quality checks
- **lint-staged** - Run checks only on staged files

### Code Formatting with Prettier

Prettier automatically formats your code to maintain consistency across the project.

#### Format Code Manually

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

#### Format on Save (VS Code)

Add this to your VS Code settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

Make sure you have the [Prettier VS Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) installed.

### Linting with ESLint

ESLint analyzes your code for potential errors and enforces coding standards.

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Pre-commit Hooks

This project uses Husky to run code quality checks before each commit. When you try to commit, the following will happen automatically:

1. **Prettier** formats all staged files
2. **ESLint** checks and fixes all staged JavaScript/TypeScript files
3. If any errors remain, the commit is blocked

This ensures all committed code meets quality standards.

#### What Runs on Commit

The pre-commit hook runs `lint-staged`, which:

- Runs `prettier --write` on staged `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.css`, and `.md` files
- Runs `eslint --fix` on staged `.js`, `.jsx`, `.ts`, and `.tsx` files

#### Bypassing Hooks (Use Sparingly)

In rare cases where you need to bypass the pre-commit hook:

```bash
git commit --no-verify -m "Your commit message"
```

**Warning:** Only use `--no-verify` in emergencies or for commits that don't affect code (like documentation fixes during CI failures). Bypassing hooks can introduce formatting inconsistencies.

### Code Quality Configuration

#### Prettier Configuration

Located in `.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

#### Files Ignored by Prettier

Located in `.prettierignore`:

- `node_modules/`
- `.next/`
- `dist/`
- `build/`
- `coverage/`

#### ESLint Configuration

Next.js provides ESLint configuration out of the box. The configuration is in `.eslintrc.json` (or `eslint.config.js`).

### How Prettier and ESLint Work Together

- **Prettier**: Handles code formatting (spacing, quotes, semicolons, etc.)
- **ESLint**: Handles code quality (unused variables, potential bugs, best practices)

These tools are configured to work together without conflicts. Prettier handles all formatting rules, while ESLint focuses on code quality rules.

### Best Practices

1. **Format before committing**: Run `npm run format` before pushing if you haven't set up format-on-save
2. **Fix linting errors**: Run `npm run lint:fix` to automatically fix most issues
3. **Don't bypass hooks**: Let the pre-commit hooks do their job
4. **Configure your editor**: Set up format-on-save for the best experience
5. **Review changes**: Check what Prettier changed before committing

### CI/CD Integration

Add these checks to your CI pipeline:

```yaml
# Example GitHub Actions workflow
- name: Check code formatting
  run: npm run format:check

- name: Run ESLint
  run: npm run lint
```

## Troubleshooting

### Docker Services Won't Start

```bash
# Check Docker is running
docker ps

# Check logs
docker compose logs

# Restart services
docker compose restart
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Check connection
docker compose exec postgres psql -U postgres -d template_db
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Or change port
PORT=3001 npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this template for any project!

## Support

For issues and questions:

- Open an issue on GitHub
- Check existing issues for solutions

## Credits

Built with modern open-source technologies:

- Next.js, React, TypeScript
- Drizzle ORM, PostgreSQL, Redis
- MinIO, BullMQ, Better Auth
- And many more amazing projects

---

**Happy Coding!** Start building your next great project with this template.
