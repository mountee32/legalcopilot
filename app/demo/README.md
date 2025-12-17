# Technology Demo Dashboard

This comprehensive demo page showcases all technologies integrated in the template project.

## Access

Visit the demo page at: `http://localhost:3000/demo`

## Features

### 1. Database (PostgreSQL + Drizzle ORM)

- Create test users
- View all users from database
- Delete users
- Demonstrates Drizzle ORM queries with typed schema

### 2. Redis Cache

- Set cache values with TTL
- Get cached values
- Clear cache
- View cache statistics (hits, misses, memory usage)

### 3. MinIO Object Storage

- Upload files to MinIO
- View uploaded files with metadata
- Download files
- Delete files from storage
- Automatic database tracking of uploads

### 4. BullMQ Job Queue

- Create email jobs
- Create image processing jobs
- View job status (pending, processing, completed, failed)
- Monitor queue statistics

### 5. AI Integration (OpenRouter)

- Send prompts to AI models
- Stream responses in real-time
- Select different models (Claude, GPT-4, Llama)
- Requires `OPENROUTER_API_KEY` environment variable

### 6. Form Validation (Zod)

- Client-side form validation
- Email format validation
- Password strength validation
- Real-time error display

### 7. Service Health Monitoring

- Real-time health checks for all services
- Database connection status
- Redis connection status
- MinIO connection status
- BullMQ queue status
- Detailed service information

## API Routes

The demo page uses the following API endpoints:

- `GET/POST/DELETE /api/demo/users` - User management
- `GET/POST/DELETE /api/demo/cache` - Cache operations
- `GET /api/demo/cache/stats` - Cache statistics
- `GET/POST/DELETE /api/demo/files` - File management
- `GET/POST /api/demo/jobs` - Job queue management
- `GET /api/demo/health` - Service health checks
- `POST /api/demo/ai` - AI text generation

## Prerequisites

Before using the demo page, ensure:

1. Docker services are running:

   ```bash
   docker-compose up -d
   ```

2. Database schema is initialized:

   ```bash
   npm run db:push
   ```

3. Environment variables are set (see `.env.example`):
   - `DATABASE_URL` - PostgreSQL connection
   - `REDIS_URL` - Redis connection
   - `MINIO_ENDPOINT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` - MinIO config
   - `OPENROUTER_API_KEY` - For AI features (optional)

## Testing the Demo

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to the demo page:**
   Open `http://localhost:3000/demo` in your browser

3. **Test each feature:**
   - Click through each tab
   - Try creating, viewing, and deleting data
   - Check the Health tab to verify all services are running

## UI Components

The demo uses shadcn/ui components:

- Card, Button, Input, Textarea
- Tabs, Badge, Alert, Label
- All styled with Tailwind CSS

## Notes

- The page is a client component (`"use client"`)
- All operations show real-time feedback (success/error messages)
- Loading states are handled for all async operations
- Data refreshes automatically after mutations
- AI features gracefully degrade if API key is not configured
