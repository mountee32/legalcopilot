# Template Project Setup TODO

## Progress Tracking

This file tracks the setup of the template repository with your preferred tech stack.

## Tasks

### Project Foundation

- [x] Create project directory structure at /home/andy/dev/template-project
- [x] Initialize Next.js 15 with TypeScript and React 19
- [x] Initialize git repository and create .gitignore

### Docker & Infrastructure

- [x] Set up Docker Compose with PostgreSQL, Redis, and MinIO containers
- [x] Add Dozzle container for log viewing
- [x] Configure environment files (.env.example)

### Database & ORM

- [x] Configure Drizzle ORM with PostgreSQL
- [x] Create initial database schema
- [x] Set up database migrations

### Frontend Setup

- [x] Set up Tailwind CSS and shadcn/ui
- [x] Create basic UI components examples

### Authentication

- [x] Configure Better Auth with database integration
- [x] Create auth API routes

### Redis & Background Jobs

- [x] Set up Redis for sessions, cache, and BullMQ
- [x] Configure BullMQ job queue with example job
- [x] Create job processing examples

### AI Integration

- [x] Configure Vercel AI SDK with OpenRouter
- [x] Create example AI endpoint

### Storage

- [x] Set up MinIO S3-compatible storage
- [x] Create file upload/download examples

### Observability & Error Tracking

- [x] Configure Sentry for error tracking
- [x] Set up error tracking examples

### Validation & Type Safety

- [x] Add Zod validation examples
- [x] Create validated API route examples

### Integration Examples

- [x] Create hello world integration examples for each service
- [x] Add sample API routes demonstrating each technology
- [x] Create dashboard showing all services status

### Documentation

- [x] Write comprehensive README with setup instructions
- [x] Document environment variables
- [x] Create SETUP.md guide
- [x] Add setup automation script

### Testing & Deployment

- [ ] Test full Docker setup on clean environment
- [ ] Verify all services are accessible
- [x] Create docker-compose.prod.yml for production
- [x] Create Dockerfile for containerized deployment

## Enhancements

### 1. Testing Setup

- [x] Install and configure Vitest for unit/integration testing
- [x] Install and configure Playwright for E2E testing
- [x] Create example unit tests for utilities and API routes
- [x] Create example E2E tests for demo page
- [x] Add test scripts to package.json
- [x] Document testing workflow in README

### 3. Code Quality Tools

- [x] Install Prettier for code formatting
- [x] Configure Prettier with project standards
- [x] Install Husky for git hooks
- [x] Install lint-staged for pre-commit checks
- [x] Set up pre-commit hook to run formatting and linting
- [x] Add format and lint scripts to package.json

### 5. Middleware Patterns

- [x] Create auth protection middleware
- [x] Create request logging middleware
- [x] Create error handling middleware
- [x] Create rate limiting middleware example
- [x] Add middleware examples to demo routes
- [x] Document middleware usage patterns

### 11. Monitoring Dashboard

- [x] Install Bull Board for BullMQ monitoring
- [x] Configure Bull Board UI route
- [x] Add Bull Board to docker services (optional - runs in app)
- [x] Create monitoring page showing queue stats
- [x] Document how to access monitoring dashboard

## Tech Stack

- Next.js 15, React 19, TypeScript
- shadcn/ui + Tailwind CSS
- Vercel AI SDK + OpenRouter
- PostgreSQL (container)
- Drizzle ORM
- Redis (sessions, cache, queues)
- Better Auth
- MinIO (S3-compatible object storage)
- Dozzle (log viewer)
- Sentry (error tracking)
- BullMQ (job queue)
- Zod (validation)

---

## Comprehensive Test Plan

This section provides detailed testing procedures to verify that all technologies are properly integrated and working as expected.

### 1. Docker Services Test

**Objective:** Verify all Docker containers are running and accessible.

**Manual Test Steps:**

1. Start all services: `docker compose up -d`
2. Check container status: `docker compose ps`
3. Verify all containers are healthy: `docker compose logs`

**Expected Outcomes:**

- All containers should show status "Up" or "healthy"
- PostgreSQL container running on port 5432
- Redis container running on port 6379
- MinIO container running on ports 9000 (API) and 9001 (Console)
- Dozzle log viewer accessible on port 8080

**Verification Commands:**

```bash
docker compose ps
docker compose logs --tail=50
curl http://localhost:3000/health
```

**Expected Results:**

- 0 containers with status "exited" or "unhealthy"
- MinIO Console accessible at http://localhost:9001
- Dozzle accessible at http://localhost:8080

---

### 2. Next.js 15 with React 19 and TypeScript Test

**Objective:** Verify Next.js application starts and renders correctly with TypeScript.

**Manual Test Steps:**

1. Start development server: `npm run dev`
2. Navigate to http://localhost:3000
3. Check browser console for errors
4. Inspect page source to verify React 19 hydration
5. Check TypeScript compilation: `npm run type-check` (if available) or `npx tsc --noEmit`

**Expected Outcomes:**

- Application loads without errors
- Hot module replacement (HMR) works when editing files
- No TypeScript compilation errors
- React DevTools shows React 19.x version
- Page renders server-side and hydrates client-side

**UI Interactions to Verify:**

- Homepage loads and displays content
- Navigation between pages works
- Client-side routing is smooth (no full page reloads)
- Browser console shows no hydration mismatches

**API Endpoint to Test:**

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-10T...",
  "services": {...}
}
```

---

### 3. PostgreSQL with Drizzle ORM Test

**Objective:** Verify database connection, schema migrations, and ORM operations.

**Manual Test Steps:**

1. Check database connection: `npm run db:push` or `npm run db:migrate`
2. Verify tables created: Connect to PostgreSQL and list tables
3. Test CRUD operations through API endpoints

**Expected Outcomes:**

- Database migrations run successfully
- All schema tables are created (users, sessions, etc.)
- Drizzle ORM can query and insert data

**API Endpoints to Test:**

```bash
# Test database connection
curl http://localhost:3000/api/db/health

# Test database query (example)
curl http://localhost:3000/api/db/test

# Test user creation (if available)
curl -X POST http://localhost:3000/api/users/test \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

**Database Verification:**

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d template_project

# List tables
\dt

# Check schema
\d users
\d sessions
```

**Expected Results:**

- Tables exist with correct schema
- Can insert and query records
- Foreign key constraints work
- Timestamps are automatically set

---

### 4. Redis for Caching and Sessions Test

**Objective:** Verify Redis connectivity and caching functionality.

**Manual Test Steps:**

1. Check Redis connection: `docker compose exec redis redis-cli ping`
2. Test cache operations via API
3. Verify session storage
4. Monitor Redis keys: `docker compose exec redis redis-cli MONITOR`

**Expected Outcomes:**

- Redis responds to PING with PONG
- Cache set/get operations work
- Session data persists across requests
- TTL (time-to-live) expires correctly

**API Endpoints to Test:**

```bash
# Test Redis cache
curl http://localhost:3000/api/cache/test

# Set cache value
curl -X POST http://localhost:3000/api/cache/set \
  -H "Content-Type: application/json" \
  -d '{"key":"test-key","value":"test-value","ttl":60}'

# Get cache value
curl http://localhost:3000/api/cache/get?key=test-key

# Test session storage
curl -X POST http://localhost:3000/api/session/test \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","data":{"name":"Test User"}}'
```

**Redis CLI Verification:**

```bash
# Connect to Redis
docker compose exec redis redis-cli

# List all keys
KEYS *

# Check specific key
GET test-key

# Check TTL
TTL test-key

# Monitor real-time commands
MONITOR
```

**Expected Results:**

- Keys are stored and retrieved correctly
- TTL decrements over time
- Session data serializes/deserializes properly
- Cache invalidation works

---

### 5. MinIO S3-Compatible Storage Test

**Objective:** Verify MinIO is accessible and file operations work.

**Manual Test Steps:**

1. Access MinIO Console: http://localhost:9001
2. Login with credentials from .env (default: minioadmin/minioadmin)
3. Verify bucket exists or create one
4. Test file upload via API
5. Test file download via API

**Expected Outcomes:**

- MinIO Console is accessible
- Can create buckets programmatically
- Files upload successfully
- Files can be retrieved via signed URLs
- File metadata is preserved

**API Endpoints to Test:**

```bash
# Test MinIO connection
curl http://localhost:3000/api/storage/health

# Upload file
curl -X POST http://localhost:3000/api/storage/upload \
  -F "file=@/path/to/test-file.txt" \
  -F "bucket=test-bucket"

# Get file URL
curl http://localhost:3000/api/storage/url?key=test-file.txt&bucket=test-bucket

# Download file
curl -O http://localhost:3000/api/storage/download?key=test-file.txt&bucket=test-bucket

# List files in bucket
curl http://localhost:3000/api/storage/list?bucket=test-bucket

# Delete file
curl -X DELETE http://localhost:3000/api/storage/delete?key=test-file.txt&bucket=test-bucket
```

**MinIO Console Verification:**

1. Navigate to http://localhost:9001
2. Login with credentials
3. Check "Buckets" section
4. Verify uploaded files appear
5. Download a file to verify integrity

**Expected Results:**

- Files upload without errors
- Correct MIME types are preserved
- Signed URLs grant temporary access
- File deletion works
- Bucket policies are enforced

---

### 6. BullMQ Job Queue Test

**Objective:** Verify BullMQ can create, process, and manage background jobs.

**Manual Test Steps:**

1. Create a test job via API
2. Monitor job processing in logs
3. Check job status via API
4. Verify job completion and results

**Expected Outcomes:**

- Jobs are added to the queue
- Workers process jobs in background
- Job status updates correctly (waiting, active, completed, failed)
- Failed jobs are retried based on configuration
- Completed jobs return results

**API Endpoints to Test:**

```bash
# Add a job to the queue
curl -X POST http://localhost:3000/api/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"type":"test-job","data":{"message":"Hello from BullMQ"}}'

# Get job status
curl http://localhost:3000/api/jobs/status?jobId=<job-id>

# Get queue stats
curl http://localhost:3000/api/jobs/stats

# Add delayed job
curl -X POST http://localhost:3000/api/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"type":"delayed-job","data":{"message":"Delayed"},"delay":5000}'

# Add recurring job
curl -X POST http://localhost:3000/api/jobs/create \
  -H "Content-Type: application/json" \
  -d '{"type":"recurring-job","data":{"message":"Recurring"},"repeat":{"pattern":"*/5 * * * *"}}'
```

**Worker Logs Verification:**

```bash
# Watch worker logs
docker compose logs -f app | grep "BullMQ"

# Or check application logs
npm run dev | grep "Job processed"
```

**Redis Queue Inspection:**

```bash
# Connect to Redis
docker compose exec redis redis-cli

# List BullMQ keys
KEYS bull:*

# Check waiting jobs
LLEN bull:test-queue:wait

# Check active jobs
LLEN bull:test-queue:active

# Check completed jobs
ZCARD bull:test-queue:completed
```

**Expected Results:**

- Jobs transition through states: waiting → active → completed
- Worker processes jobs in the background
- Job results are stored and retrievable
- Failed jobs move to failed set
- Delayed jobs execute after delay period

---

### 7. Better Auth Authentication Test

**Objective:** Verify user registration, login, session management, and protected routes.

**Manual Test Steps:**

1. Register a new user
2. Login with credentials
3. Access protected route
4. Logout
5. Verify session is cleared

**Expected Outcomes:**

- Users can register with email/password
- Passwords are hashed and secure
- Login creates session
- Protected routes redirect unauthenticated users
- Sessions persist across page refreshes
- Logout clears session

**API Endpoints to Test:**

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# Get current user (requires session cookie)
curl http://localhost:3000/api/auth/me \
  -H "Cookie: auth-session=<session-token>"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: auth-session=<session-token>"

# Test protected route
curl http://localhost:3000/api/protected \
  -H "Cookie: auth-session=<session-token>"
```

**UI Interactions to Verify:**

1. Navigate to /auth/register
   - Fill in registration form
   - Submit and verify redirect
2. Navigate to /auth/login
   - Enter credentials
   - Verify successful login
   - Check that session cookie is set
3. Access protected page (e.g., /dashboard)
   - Should load if authenticated
   - Should redirect to login if not
4. Click logout button
   - Verify redirect to home/login
   - Verify cannot access protected pages

**Database Verification:**

```sql
-- Check users table
SELECT id, email, name, created_at FROM users;

-- Check sessions table
SELECT id, user_id, expires_at FROM sessions;

-- Verify password is hashed
SELECT password FROM users WHERE email = 'test@example.com';
```

**Expected Results:**

- Passwords are bcrypt/argon2 hashed
- Sessions are stored in database
- CSRF protection works
- Session cookies are httpOnly and secure
- Email validation prevents duplicates

---

### 8. Vercel AI SDK with OpenRouter Test

**Objective:** Verify AI integration works and can generate responses.

**Manual Test Steps:**

1. Check OpenRouter API key is set in .env
2. Test AI completion endpoint
3. Test streaming responses
4. Verify token usage tracking

**Expected Outcomes:**

- OpenRouter API is accessible
- AI generates relevant responses
- Streaming works for real-time output
- Errors are handled gracefully
- Rate limits are respected

**API Endpoints to Test:**

```bash
# Test AI completion
curl -X POST http://localhost:3000/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a haiku about coding","model":"anthropic/claude-3-sonnet"}'

# Test streaming response
curl -N -X POST http://localhost:3000/api/ai/stream \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Count from 1 to 10 slowly","model":"anthropic/claude-3-sonnet"}'

# Test chat completion
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}],"model":"anthropic/claude-3-sonnet"}'

# Check available models
curl http://localhost:3000/api/ai/models
```

**UI Interactions to Verify:**

1. Navigate to AI demo page (e.g., /demo/ai)
2. Enter a prompt in the input field
3. Submit and watch streaming response
4. Verify response appears in real-time
5. Test different models if available

**Expected Results:**

- API returns valid AI responses
- Streaming shows partial responses
- Token usage is tracked
- Errors show user-friendly messages
- Timeout handling works (30s+ responses)

---

### 9. Zod Validation Test

**Objective:** Verify input validation and type safety across API routes.

**Manual Test Steps:**

1. Send valid data to validated endpoint
2. Send invalid data (wrong types)
3. Send missing required fields
4. Send extra/unknown fields
5. Verify error messages are descriptive

**Expected Outcomes:**

- Valid data passes validation
- Invalid data returns 400 errors
- Error messages specify which fields failed
- Type coercion works where configured
- Nested objects are validated

**API Endpoints to Test:**

```bash
# Valid request
curl -X POST http://localhost:3000/api/validate/user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","age":25,"name":"John Doe"}'

# Invalid email
curl -X POST http://localhost:3000/api/validate/user \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","age":25,"name":"John Doe"}'

# Missing required field
curl -X POST http://localhost:3000/api/validate/user \
  -H "Content-Type: application/json" \
  -d '{"age":25,"name":"John Doe"}'

# Wrong type
curl -X POST http://localhost:3000/api/validate/user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","age":"twenty-five","name":"John Doe"}'

# Extra fields (should be stripped or rejected)
curl -X POST http://localhost:3000/api/validate/user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","age":25,"name":"John Doe","hacker":"field"}'
```

**Expected Error Format:**

```json
{
  "error": "Validation failed",
  "issues": [
    {
      "path": ["email"],
      "message": "Invalid email address"
    }
  ]
}
```

**Code-Level Verification:**

- Check that Zod schemas are defined for all API routes
- Verify schemas use appropriate types (z.string(), z.number(), etc.)
- Confirm custom error messages are set
- Check that validated data has correct TypeScript types

**Expected Results:**

- 200 OK for valid data
- 400 Bad Request for invalid data
- Clear error messages for each failed field
- Type safety in TypeScript code
- No runtime type errors

---

### 10. Sentry Error Tracking Test

**Objective:** Verify Sentry captures and reports errors correctly.

**Manual Test Steps:**

1. Check Sentry DSN is configured in .env
2. Trigger a test error
3. Verify error appears in Sentry dashboard
4. Test source map uploading (production builds)
5. Verify user context is captured

**Expected Outcomes:**

- Errors are captured and sent to Sentry
- Stack traces show correct file/line numbers
- User context is attached to errors
- Breadcrumbs track user actions
- Performance monitoring works (if enabled)

**API Endpoints to Test:**

```bash
# Trigger test error
curl http://localhost:3000/api/sentry/test-error

# Trigger unhandled error
curl http://localhost:3000/api/sentry/unhandled

# Trigger async error
curl http://localhost:3000/api/sentry/async-error

# Test error with context
curl -X POST http://localhost:3000/api/sentry/error-with-context \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","action":"test-action"}'
```

**UI Interactions to Verify:**

1. Navigate to error demo page (e.g., /demo/error)
2. Click "Trigger Error" button
3. Check browser console for error
4. Navigate to Sentry dashboard
5. Verify error appears with correct details

**Sentry Dashboard Verification:**

1. Login to Sentry dashboard
2. Navigate to project
3. Check "Issues" tab for recent errors
4. Verify error details:
   - Correct error message
   - Stack trace points to source files
   - User context (if logged in)
   - Breadcrumbs show navigation history
   - Environment is set correctly (development/production)

**Expected Results:**

- Errors appear in Sentry within 1-2 minutes
- Source maps resolve to original TypeScript files
- Duplicate errors are grouped
- Error frequency is tracked
- Alerting rules trigger (if configured)

---

### 11. shadcn/ui Components Test

**Objective:** Verify UI component library is properly integrated and styled.

**Manual Test Steps:**

1. Navigate to components demo page
2. Test each component interaction
3. Verify responsive design
4. Check dark mode support
5. Verify accessibility features

**Expected Outcomes:**

- Components render correctly
- Tailwind CSS styles apply
- Interactive components respond to user input
- Animations work smoothly
- Components are accessible (keyboard navigation, screen readers)

**UI Components to Verify:**

1. Button variants (default, outline, ghost, destructive)
2. Form inputs (text, email, password, textarea)
3. Select/dropdown menus
4. Dialog/modal windows
5. Toast notifications
6. Cards and containers
7. Navigation menus
8. Data tables
9. Tabs component
10. Accordion component

**UI Interactions to Test:**

```
Button Component:
- Click button → Verify action executes
- Hover → Verify hover state
- Focus (Tab key) → Verify focus ring
- Disabled state → Verify cannot click

Form Components:
- Type in input → Verify value updates
- Submit form → Verify validation
- Show errors → Verify error styling
- Clear form → Verify reset works

Dialog Component:
- Click "Open Dialog" → Modal appears
- Click overlay → Modal closes
- Press Escape → Modal closes
- Focus trap → Tab cycles through dialog elements

Toast Notification:
- Trigger toast → Appears in corner
- Auto-dismiss → Disappears after timeout
- Manual dismiss → Click X to close
- Multiple toasts → Stack correctly
```

**Responsive Design Test:**

1. Resize browser to mobile width (375px)
2. Verify components adapt layout
3. Check hamburger menu on mobile
4. Test touch interactions
5. Verify no horizontal scrolling

**Dark Mode Test:**

1. Toggle dark mode switch
2. Verify all components update theme
3. Check contrast ratios meet WCAG standards
4. Verify images/icons adapt

**Expected Results:**

- All components match shadcn/ui design
- Consistent styling across pages
- Smooth transitions and animations
- No console warnings or errors
- Components are keyboard accessible

---

### 12. Full Integration Test

**Objective:** Verify multiple technologies work together in realistic scenarios.

**Scenario 1: User Registration with Background Job**

1. User registers on the website
2. Better Auth creates user in PostgreSQL
3. BullMQ job sends welcome email (simulated)
4. Redis caches user profile
5. MinIO stores user avatar (if uploaded)

**Test Steps:**

```bash
# 1. Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"integration@test.com","password":"Test123!","name":"Integration User"}'

# 2. Check database for user
docker compose exec postgres psql -U postgres -d template_project \
  -c "SELECT * FROM users WHERE email='integration@test.com';"

# 3. Check BullMQ job queue
curl http://localhost:3000/api/jobs/stats

# 4. Check Redis cache
docker compose exec redis redis-cli GET "user:integration@test.com"

# 5. Upload avatar
curl -X POST http://localhost:3000/api/storage/upload \
  -H "Cookie: auth-session=<session-token>" \
  -F "file=@avatar.jpg" \
  -F "bucket=avatars"
```

**Expected Outcome:**

- User created in PostgreSQL
- Welcome email job queued and processed
- User profile cached in Redis
- Avatar stored in MinIO
- All operations logged in Dozzle

---

**Scenario 2: AI-Powered Content Generation with Validation**

1. User submits prompt with Zod validation
2. Prompt passes validation
3. Vercel AI SDK calls OpenRouter
4. Response streams back to client
5. Result stored in PostgreSQL
6. Job queued to post-process content

**Test Steps:**

```bash
# 1. Submit AI request with validation
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-session=<session-token>" \
  -d '{"prompt":"Write a product description","maxTokens":500,"model":"anthropic/claude-3-sonnet"}'

# 2. Check database for saved response
docker compose exec postgres psql -U postgres -d template_project \
  -c "SELECT * FROM ai_generations ORDER BY created_at DESC LIMIT 1;"

# 3. Verify job was queued
curl http://localhost:3000/api/jobs/stats
```

**Expected Outcome:**

- Validation passes for correct input format
- AI generates response using OpenRouter
- Response saved to PostgreSQL
- Post-processing job queued in BullMQ
- User can retrieve generation history

---

**Scenario 3: File Upload with Processing Pipeline**

1. User uploads file to MinIO
2. File metadata stored in PostgreSQL
3. BullMQ job processes file (virus scan, thumbnail, etc.)
4. Result cached in Redis
5. Sentry tracks any errors

**Test Steps:**

```bash
# 1. Upload file
curl -X POST http://localhost:3000/api/files/upload \
  -H "Cookie: auth-session=<session-token>" \
  -F "file=@document.pdf"

# 2. Check file in MinIO
curl http://localhost:3000/api/storage/list?bucket=uploads

# 3. Check metadata in PostgreSQL
docker compose exec postgres psql -U postgres -d template_project \
  -c "SELECT * FROM files ORDER BY created_at DESC LIMIT 1;"

# 4. Verify processing job
curl http://localhost:3000/api/jobs/status?jobId=<file-job-id>

# 5. Check cached result
docker compose exec redis redis-cli GET "file:<file-id>"
```

**Expected Outcome:**

- File uploaded to MinIO successfully
- Metadata saved in PostgreSQL
- Processing job runs in background
- Processed result cached in Redis
- Any errors captured by Sentry

---

**Scenario 4: Error Handling Across Stack**

1. Trigger error in API route
2. Sentry captures error with context
3. Error response includes correlation ID
4. Logs viewable in Dozzle
5. Database transaction rolls back

**Test Steps:**

```bash
# 1. Trigger error that touches multiple services
curl -X POST http://localhost:3000/api/test/integration-error \
  -H "Content-Type: application/json" \
  -d '{"triggerError":true}'

# 2. Check Sentry for error
# (Visit Sentry dashboard)

# 3. Check logs in Dozzle
# (Visit http://localhost:8080)

# 4. Verify database consistency
docker compose exec postgres psql -U postgres -d template_project \
  -c "SELECT COUNT(*) FROM users;"
```

**Expected Outcome:**

- Error is caught and logged
- Sentry receives error with full context
- Database transaction rolls back (no partial data)
- Logs are centralized in Dozzle
- User receives meaningful error message

---

### Test Checklist Summary

Use this checklist to verify all technologies are working:

**Docker Services:**

- [ ] All containers are running
- [ ] PostgreSQL accessible on port 5432
- [ ] Redis accessible on port 6379
- [ ] MinIO accessible on ports 9000/9001
- [ ] Dozzle accessible on port 8080

**Next.js Application:**

- [ ] Development server starts without errors
- [ ] TypeScript compilation succeeds
- [ ] Hot module replacement works
- [ ] API routes respond correctly
- [ ] Pages render server-side and client-side

**Database & ORM:**

- [ ] Drizzle migrations run successfully
- [ ] Can create, read, update, delete records
- [ ] Transactions work correctly
- [ ] Foreign keys enforced

**Redis:**

- [ ] Cache set/get operations work
- [ ] Sessions persist correctly
- [ ] TTL expiration works
- [ ] BullMQ uses Redis for queues

**MinIO Storage:**

- [ ] Console accessible and functional
- [ ] Files upload successfully
- [ ] Files download correctly
- [ ] Signed URLs work
- [ ] Bucket policies enforced

**BullMQ:**

- [ ] Jobs added to queue
- [ ] Workers process jobs
- [ ] Job status updates correctly
- [ ] Failed jobs retry
- [ ] Delayed and recurring jobs work

**Authentication:**

- [ ] User registration works
- [ ] Login creates session
- [ ] Protected routes enforced
- [ ] Logout clears session
- [ ] Passwords hashed securely

**AI Integration:**

- [ ] OpenRouter API accessible
- [ ] Completions generate responses
- [ ] Streaming works
- [ ] Token usage tracked
- [ ] Errors handled gracefully

**Validation:**

- [ ] Zod validates inputs
- [ ] Invalid data rejected with clear errors
- [ ] Type safety enforced
- [ ] Nested objects validated

**Error Tracking:**

- [ ] Sentry captures errors
- [ ] Source maps resolve correctly
- [ ] User context attached
- [ ] Breadcrumbs tracked

**UI Components:**

- [ ] shadcn/ui components render
- [ ] Tailwind styles apply
- [ ] Interactive components work
- [ ] Responsive design adapts
- [ ] Dark mode toggles correctly

**Integration:**

- [ ] Multiple services work together
- [ ] Data flows between components
- [ ] Errors are handled across stack
- [ ] Transactions maintain consistency

---

### Automated Test Script

Create a test script to verify all services programmatically:

```bash
#!/bin/bash
# test-all-services.sh

echo "Starting comprehensive service tests..."

# Test Docker containers
echo "1. Testing Docker containers..."
docker compose ps | grep -q "Up" && echo "✓ Docker containers running" || echo "✗ Docker containers failed"

# Test PostgreSQL
echo "2. Testing PostgreSQL..."
docker compose exec -T postgres pg_isready -U postgres && echo "✓ PostgreSQL ready" || echo "✗ PostgreSQL failed"

# Test Redis
echo "3. Testing Redis..."
docker compose exec -T redis redis-cli ping | grep -q "PONG" && echo "✓ Redis ready" || echo "✗ Redis failed"

# Test MinIO
echo "4. Testing MinIO..."
curl -f http://localhost:9000/minio/health/live && echo "✓ MinIO ready" || echo "✗ MinIO failed"

# Test Next.js API
echo "5. Testing Next.js API..."
curl -f http://localhost:3000/api/health && echo "✓ Next.js API ready" || echo "✗ Next.js API failed"

# Test database connection
echo "6. Testing database connection..."
curl -f http://localhost:3000/api/db/health && echo "✓ Database connected" || echo "✗ Database connection failed"

# Test Redis connection
echo "7. Testing Redis connection..."
curl -f http://localhost:3000/api/cache/test && echo "✓ Redis cache working" || echo "✗ Redis cache failed"

# Test MinIO connection
echo "8. Testing MinIO connection..."
curl -f http://localhost:3000/api/storage/health && echo "✓ MinIO storage working" || echo "✗ MinIO storage failed"

# Test BullMQ
echo "9. Testing BullMQ..."
curl -f http://localhost:3000/api/jobs/stats && echo "✓ BullMQ working" || echo "✗ BullMQ failed"

echo ""
echo "Test suite completed!"
```

---

### Performance Benchmarks

Expected performance metrics for a healthy system:

**API Response Times:**

- Simple GET requests: < 50ms
- Database queries: < 100ms
- Redis cache hits: < 10ms
- MinIO file uploads (1MB): < 200ms
- AI completions: 1-5 seconds (depending on model)

**Resource Usage:**

- PostgreSQL: < 100MB RAM idle, < 500MB under load
- Redis: < 50MB RAM
- MinIO: < 100MB RAM idle
- Next.js app: < 200MB RAM in development

**Throughput:**

- API requests: > 100 req/s
- Database queries: > 500 queries/s
- Redis operations: > 10,000 ops/s
- BullMQ jobs: > 50 jobs/s

Use tools like `wrk`, `ab` (Apache Bench), or `k6` to benchmark your endpoints.

---

### Troubleshooting Common Issues

**Issue: Docker containers won't start**

- Check Docker Desktop is running
- Verify ports are not already in use: `lsof -i :5432,6379,9000`
- Check Docker logs: `docker compose logs`

**Issue: Database connection fails**

- Verify DATABASE_URL in .env is correct
- Check PostgreSQL is ready: `docker compose exec postgres pg_isready`
- Wait 5-10 seconds after starting containers

**Issue: Redis connection fails**

- Verify REDIS_URL in .env is correct
- Check Redis is running: `docker compose exec redis redis-cli ping`

**Issue: MinIO connection fails**

- Verify MINIO_ENDPOINT, access key, and secret key in .env
- Check MinIO is healthy: `curl http://localhost:9000/minio/health/live`

**Issue: AI requests fail**

- Verify OPENROUTER_API_KEY is set and valid
- Check OpenRouter status: https://openrouter.ai/status
- Verify model name is correct

**Issue: Authentication not working**

- Clear browser cookies and try again
- Check Better Auth configuration
- Verify database sessions table exists

**Issue: Jobs not processing**

- Check BullMQ worker is running
- Verify Redis connection
- Check worker logs for errors

---

### Continuous Integration Testing

For CI/CD pipelines, create a test workflow:

```yaml
# .github/workflows/test.yml
name: Test All Services

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start Docker services
        run: docker compose up -d

      - name: Wait for services
        run: sleep 10

      - name: Run test script
        run: bash test-all-services.sh

      - name: Check TypeScript
        run: npm run type-check

      - name: Run tests
        run: npm test

      - name: Stop Docker services
        run: docker compose down
```

This ensures all services are tested on every code change.
