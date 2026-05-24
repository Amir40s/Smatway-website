# Deployment Setup Guide

## Task 19: Google Cloud Console Setup

### OAuth 2.0 Credentials Configuration

1. **Create OAuth 2.0 Client ID** (if not exists):
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (Web application type)
   - Set Application name: "SmatWay"

2. **Configure Authorized Origins**:
   ```
   http://localhost:3000
   http://localhost:3001
   https://web.smatway.com
   https://admin.smatway.com
   ```

3. **Configure Authorized Redirect URIs**:
   ```
   http://localhost:3002/auth/google/callback
   http://localhost:3000/auth/google/callback
   https://api.smatway.com/auth/google/callback
   https://web.smatway.com/auth/google/callback
   https://admin.smatway.com/auth/google/callback
   ```

4. **Store Credentials** in `.env`:
   ```
   GOOGLE_CLIENT_ID=<from Google Console>
   GOOGLE_CLIENT_SECRET=<from Google Console>
   GOOGLE_CALLBACK_URL=http://localhost:3002/auth/google/callback
   ```

---

## Task 20: Coolify Deployment Environment Variables

### Per-Service Configuration

#### API Service (`apps/api`)

```env
# Core
NODE_ENV=production
PORT=3002
JWT_SECRET=<generate-strong-random-64-chars>
JWT_EXPIRES_IN=15m

# Database
DATABASE_URL=postgresql://user:pass@host:5432/smatway_db

# Cache
REDIS_URL=redis://host:6379

# Shared auth cookie domain across subdomains
COOKIE_DOMAIN=.smatway.com

# Auth
ALLOWED_REDIRECT_URLS=https://web.smatway.com,https://admin.smatway.com
WEB_URL=https://web.smatway.com
ADMIN_URL=https://admin.smatway.com

# OAuth
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
GOOGLE_CALLBACK_URL=https://api.smatway.com/auth/google/callback

# Email
RESEND_API_KEY=<from Resend Dashboard>
MAIL_FROM=noreply@smatway.com
```

#### Web Service (`apps/web`)

```env
# Public API URL (visible to frontend)
NEXT_PUBLIC_API_BASE_URL=https://api.smatway.com
```

#### Admin Service (`apps/admin`)

```env
# Public API URL (visible to frontend)
NEXT_PUBLIC_API_BASE_URL=https://api.smatway.com
```

### Deployment Order

1. Deploy database migrations (if any pending)
2. Deploy API service first
3. Deploy Web and Admin services in parallel

### Health Check Endpoints

- API: `https://api.smatway.com/health`
- Web: `https://web.smatway.com/` (Next.js status)
- Admin: `https://admin.smatway.com/` (Next.js status)

### Notes

- Use strong random JWT_SECRET (64+ chars)
- All HTTPS URLs in production
- Store secrets in Coolify secret manager, not in git
- Ensure PostgreSQL version compatibility (tested on 14+)
- Redis is optional for dev, required for multi-instance production
