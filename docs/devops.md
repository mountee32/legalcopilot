# DevOps & Deployment

## Vercel Deployment

### Project Details

| Setting            | Value                                        |
| ------------------ | -------------------------------------------- |
| **Project ID**     | `prj_PkxE0MIh6kEAvkjJPemGX98mQlnx`           |
| **Team**           | Realise AI (`team_gFgVVBkiOF4rLGr3acfs0KI9`) |
| **Production URL** | https://legalcopilot-self.vercel.app         |
| **Framework**      | Next.js 15 (auto-detected)                   |

### Domains

| Domain                   | Type     | Notes                  |
| ------------------------ | -------- | ---------------------- |
| `legalcopilot.co.uk`     | Primary  | Main production domain |
| `legalcopilot.uk`        | Redirect | 301 redirect to .co.uk |
| `www.legalcopilot.co.uk` | Redirect | 301 redirect to apex   |

### DNS Configuration (Hostinger)

For **legalcopilot.co.uk**:

| Type  | Name  | Value                  |
| ----- | ----- | ---------------------- |
| A     | `@`   | `216.198.79.1`         |
| CNAME | `www` | `cname.vercel-dns.com` |

For **legalcopilot.uk**:

| Type | Name | Value          |
| ---- | ---- | -------------- |
| A    | `@`  | `216.198.79.1` |

Alternative Vercel IPs (if primary doesn't work):

- `76.76.21.21`
- `64.29.17.1`

### Environment Variables

The following environment variables are configured in Vercel for build:

| Variable              | Purpose                      |
| --------------------- | ---------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string |
| `REDIS_URL`           | Redis connection string      |
| `BETTER_AUTH_SECRET`  | Auth secret (min 32 chars)   |
| `MINIO_ENDPOINT`      | MinIO/S3 endpoint            |
| `MINIO_PORT`          | MinIO port                   |
| `MINIO_ROOT_USER`     | MinIO access key             |
| `MINIO_ROOT_PASSWORD` | MinIO secret key             |
| `MINIO_ACCESS_KEY`    | MinIO access key (alias)     |
| `MINIO_SECRET_KEY`    | MinIO secret key (alias)     |
| `MINIO_USE_SSL`       | SSL for MinIO                |

**Note:** These are placeholder values for build. Production values need to be configured when backend services are provisioned.

### Deployment

#### Via CLI

```bash
# Install Vercel CLI (if not installed)
npm install vercel --save-dev

# Deploy to production
npx vercel --prod

# Or with token (for CI/CD)
npx vercel --token $VERCEL_TOKEN --yes --prod
```

#### Git Author Requirement

Vercel requires the git commit author email to match a team member. The configured email is:

- `andy.slade@realiseai.co.uk`

If you get "Git author must have access to team" errors, ensure your git config matches:

```bash
git config user.email "andy.slade@realiseai.co.uk"
```

### Build Configuration

The project uses these build settings (in `next.config.ts`):

```typescript
typescript: {
  ignoreBuildErrors: true,  // TODO: Fix route handler types
},
eslint: {
  ignoreDuringBuilds: true, // TODO: Fix ESLint warnings
},
```

**Note:** These are temporary workarounds. The proper fix is to update route handlers to Next.js 15's async params pattern.

### Redirects

Redirects are configured in `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "legalcopilot.uk" }],
      "destination": "https://legalcopilot.co.uk/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.legalcopilot.uk" }],
      "destination": "https://legalcopilot.co.uk/:path*",
      "permanent": true
    },
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.legalcopilot.co.uk" }],
      "destination": "https://legalcopilot.co.uk/:path*",
      "permanent": true
    }
  ]
}
```

### Known Issues

1. **Build-time env vars**: Several modules (redis, minio, db) require environment variables at build time. These use lazy initialization to avoid build failures.

2. **Bull Board disabled**: The `/api/bull-board` route is stubbed out in production as it requires Redis at build time.

3. **Next.js 15 route types**: Route handlers need updating to use `Promise<{ params: ... }>` pattern for dynamic routes.

---

## Vercel API Reference

### Authentication

```bash
curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user
```

### Add Domain

```bash
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/domains" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"example.com"}'
```

### Add Domain with Redirect

```bash
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/domains" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"www.example.com","redirect":"example.com","redirectStatusCode":301}'
```

### Add Environment Variable

```bash
curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"VAR_NAME","value":"value","type":"encrypted","target":["production","preview","development"]}'
```

### Check Domain DNS Config

```bash
curl "https://api.vercel.com/v6/domains/example.com/config" \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```
