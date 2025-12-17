# Testing Instructions

This document provides testing steps to verify your template project setup.

## Prerequisites

Ensure you have installed:

- Node.js 18+ (`node --version`)
- npm (`npm --version`)
- Docker (`docker --version`)
- Docker Compose (`docker compose version`)

## Quick Test

Run the automated setup script:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:

1. Check prerequisites
2. Install dependencies
3. Create .env file
4. Start Docker services
5. Initialize database

## Automated Tests

### Vitest (unit)

```bash
npm test
```

### Vitest (integration)

Requires Docker services running (`docker compose up -d`) and the app DB migrated/pushed.

```bash
npm run test:integration
```

### Playwright (E2E)

Requires Docker services running (`docker compose up -d`) and the app DB migrated/pushed. Playwright will start the Next dev server automatically via `playwright.config.ts`.

```bash
npm run test:e2e         # all projects (API + browsers)
npm run test:e2e:api     # API scenarios only
npm run test:e2e:browser # browser UI tests (chromium)
```

## Manual Testing

### 1. Install Dependencies

```bash
npm install
```

Expected: All packages install without errors.

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and generate a secure secret:

```bash
openssl rand -base64 32
```

Add it to `.env` as `BETTER_AUTH_SECRET`.

### 3. Start Docker Services

```bash
docker compose up -d
```

Expected output:

```
✅ PostgreSQL started
✅ Redis started
✅ MinIO started
✅ Dozzle started
```

Verify services:

```bash
docker compose ps
```

All services should show status "Up".

### 4. Check Service Health

**PostgreSQL:**

```bash
docker compose exec postgres psql -U postgres -d template_db -c "SELECT version();"
```

Expected: PostgreSQL version information.

**Redis:**

```bash
docker compose exec redis redis-cli ping
```

Expected: `PONG`

**MinIO:**
Visit http://localhost:9001

- Login: minioadmin / minioadmin
- Expected: MinIO Console dashboard

**Dozzle:**
Visit http://localhost:8080

- Expected: Docker log viewer interface

### 5. Initialize Database

```bash
npm run db:push
```

Expected output:

```
✅ Tables created: users, sessions, accounts, jobs, uploads
```

Verify tables:

```bash
docker compose exec postgres psql -U postgres -d template_db -c "\dt"
```

Expected: List of 5 tables.

### 6. Start Development Server

```bash
npm run dev
```

Expected:

```
✅ Ready on http://localhost:3000
```

### 7. Test Application

**Home Page:**

- Visit http://localhost:3000
- Expected: Landing page with tech stack overview

**Dashboard:**

- Visit http://localhost:3000/dashboard
- Expected: Dashboard with service test buttons

**Health Check:**

- Click "Check Health" button
- Expected: All services show green checkmarks

**File Upload:**

- Click "Test Upload" button
- Expected: Success message with file URL

**Job Queue:**

- Click "Create Test Job" button
- Expected: Job created with ID

**AI (if OPENROUTER_API_KEY configured):**

- Click "Test AI" button
- Expected: AI response message

### 8. API Endpoint Tests

**Health API:**

```bash
curl http://localhost:3000/api/health
```

Expected: JSON with all services showing "Connected".

**File Upload API:**

```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -F "file=@/path/to/test.txt"
```

Expected: JSON with upload success and URL.

**Job Creation API:**

```bash
curl -X POST http://localhost:3000/api/jobs/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "data": {
      "to": "test@example.com",
      "subject": "Test",
      "body": "Test email"
    }
  }'
```

Expected: JSON with job ID.

**AI Chat API (requires OPENROUTER_API_KEY):**

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

Expected: Streaming AI response.

## Service UI Tests

### MinIO Console (http://localhost:9001)

1. Login with minioadmin / minioadmin
2. Navigate to "Buckets"
3. Expected: "uploads" bucket exists
4. Click on "uploads" bucket
5. Expected: Uploaded test files visible

### Dozzle Logs (http://localhost:8080)

1. Open in browser
2. Expected: List of running containers
3. Click on any container
4. Expected: Live log stream

### Drizzle Studio

```bash
npm run db:studio
```

1. Open browser at provided URL
2. Expected: Database schema browser
3. Click on "users" table
4. Expected: Table structure and data view

## Load Testing

### Database Connection Pool

```bash
# Create a test script to verify connection pooling
node -e "
const { db } = require('./lib/db');
Promise.all([...Array(10)].map(() =>
  db.select().from(require('./lib/db/schema').users)
)).then(() => console.log('✅ Connection pool working'));
"
```

### MinIO Upload Load

```bash
# Test multiple concurrent uploads
for i in {1..5}; do
  echo "Test file $i" > test$i.txt
  curl -X POST http://localhost:3000/api/storage/upload \
    -F "file=@test$i.txt" &
done
wait
```

Expected: All uploads succeed.

### Redis Performance

```bash
docker compose exec redis redis-cli --intrinsic-latency 100
```

Expected: Latency under 1ms.

## Cleanup After Testing

```bash
# Stop services
docker compose down

# Remove volumes (WARNING: deletes data)
docker compose down -v

# Clean npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules
```

## Troubleshooting Tests

### Test Fails: Port Already in Use

```bash
# Find what's using the port
lsof -i :3000
lsof -i :5432
lsof -i :6379
lsof -i :9000

# Kill the process or use different ports
```

### Test Fails: Docker Services Won't Start

```bash
# Check Docker daemon
sudo systemctl status docker

# Check logs
docker compose logs

# Restart Docker
sudo systemctl restart docker
```

### Test Fails: Database Connection

```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test connection
docker compose exec postgres psql -U postgres -c "SELECT 1"
```

### Test Fails: Permission Issues

```bash
# Fix file permissions
chmod -R 755 scripts/
chmod +x scripts/setup.sh

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

## Integration Test Checklist

- [ ] All Docker services start successfully
- [ ] Database migrations run without errors
- [ ] Home page loads correctly
- [ ] Dashboard loads with all components
- [ ] Health check shows all services connected
- [ ] File upload creates file in MinIO
- [ ] Job queue creates and processes jobs
- [ ] AI endpoint responds (with API key)
- [ ] MinIO console accessible
- [ ] Dozzle logs visible
- [ ] Drizzle Studio opens database
- [ ] No errors in console logs
- [ ] No errors in Docker logs

## Continuous Testing

For ongoing development:

```bash
# Watch mode for TypeScript
npm run dev

# Monitor Docker logs
docker compose logs -f

# Monitor database queries (in another terminal)
docker compose exec postgres tail -f /var/log/postgresql/*.log
```

## Performance Benchmarks

Expected performance on modern hardware:

- **Page Load**: < 1s
- **API Response**: < 100ms
- **Database Query**: < 10ms
- **File Upload (1MB)**: < 500ms
- **Docker Start**: < 30s

If performance is significantly worse, check:

- Docker resource limits
- Database indexing
- Network latency
- Disk I/O

---

All tests passing? You're ready to build! 🚀
