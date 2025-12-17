# Setup Guide

Step-by-step guide to get your template project up and running.

## Prerequisites Check

```bash
# Check Node.js version (need 18+)
node --version

# Check npm
npm --version

# Check Docker
docker --version
docker compose version
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Next.js and React
- Database and ORM tools
- Authentication libraries
- AI SDK and integrations
- All other dependencies

### 2. Set Up Environment

```bash
# Copy the environment template
cp .env.example .env
```

Edit `.env` and update these critical values:

```env
# Generate a secure secret
BETTER_AUTH_SECRET=<run: openssl rand -base64 32>

# Database (default works for local development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/template_db

# Redis (default works for local development)
REDIS_URL=redis://localhost:6379
```

### 3. Start Docker Services

```bash
# Start PostgreSQL, Redis, MinIO, and Dozzle
docker compose up -d

# Verify services are running
docker compose ps

# Expected output: All services should show "running"
```

### 4. Initialize Database

```bash
# Push the schema to PostgreSQL
npm run db:push

# This creates all tables: users, sessions, accounts, jobs, uploads
```

### 5. Verify Setup

```bash
# Check service health
docker compose ps

# View logs if needed
docker compose logs -f

# Test database connection
docker compose exec postgres psql -U postgres -d template_db -c "SELECT version();"
```

### 6. Start Development

```bash
# Start Next.js development server
npm run dev
```

Visit http://localhost:3000 to see your app!

## Post-Setup Configuration

### Optional: Configure OAuth

For Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add to `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

For GitHub OAuth:

1. Go to GitHub Settings > Developer Settings > OAuth Apps
2. Create new OAuth app
3. Add to `.env`:

```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

### Optional: Configure AI

Get OpenRouter API key:

1. Visit [OpenRouter](https://openrouter.ai)
2. Sign up and create API key
3. Add to `.env`:

```env
OPENROUTER_API_KEY=your-api-key
```

### Optional: Configure Sentry

For error tracking:

1. Visit [Sentry](https://sentry.io)
2. Create new project
3. Add to `.env`:

```env
SENTRY_DSN=your-dsn
NEXT_PUBLIC_SENTRY_DSN=your-dsn
```

## Testing Your Setup

### 1. Visit the Dashboard

Go to http://localhost:3000/dashboard

### 2. Test Each Service

**Health Check:**

- Click "Check Health" button
- All services should show green checkmarks

**MinIO Storage:**

- Click "Test Upload"
- Should see success message with file URL

**BullMQ Jobs:**

- Click "Create Test Job"
- Should see job ID in response

**AI (if configured):**

- Click "Test AI"
- Should see AI response

### 3. Access Service UIs

- **MinIO Console**: http://localhost:9001
  - Login: minioadmin / minioadmin
  - Browse uploaded files

- **Dozzle Logs**: http://localhost:8080
  - View real-time container logs

- **Drizzle Studio**: Run `npm run db:studio`
  - Visual database browser

## Common Issues

### Port Already in Use

**Problem:** Port 3000, 5432, 6379, 9000, or 9001 already in use

**Solution:**

```bash
# Find what's using the port
lsof -i :3000

# Kill the process or change the port in .env
```

### Docker Services Not Starting

**Problem:** Services fail to start

**Solution:**

```bash
# Check Docker is running
docker ps

# View error logs
docker compose logs

# Reset everything
docker compose down -v
docker compose up -d
```

### Database Connection Failed

**Problem:** Can't connect to PostgreSQL

**Solution:**

```bash
# Ensure PostgreSQL container is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Verify connection string in .env matches docker-compose.yml
```

### Permission Denied (MinIO)

**Problem:** Can't create bucket or upload files

**Solution:**

- Check MinIO credentials in `.env`
- Verify MinIO container is running
- Check MinIO logs: `docker compose logs minio`

## Next Steps

1. **Explore the Code**
   - Check out `app/api/` for example endpoints
   - Review `lib/` for utility functions
   - Look at `components/ui/` for UI components

2. **Start Building**
   - Add your own database tables in `lib/db/schema/` (re-exported via `lib/db/schema/index.ts`)
   - Create new API routes in `app/api/`
   - Build your UI in `app/`

3. **Read the Docs**
   - [Next.js Documentation](https://nextjs.org/docs)
   - [Drizzle ORM](https://orm.drizzle.team)
   - [Better Auth](https://better-auth.com)
   - [BullMQ](https://docs.bullmq.io)

## Getting Help

- Check `README.md` for detailed documentation
- Review example code in the project
- Open an issue if you find bugs

---

Happy building! 🚀
