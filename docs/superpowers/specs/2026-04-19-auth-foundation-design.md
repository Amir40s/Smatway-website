# Auth Foundation Design — 2026-04-19

## Summary

Full authentication foundation for the smatway monorepo. NestJS API owns all auth logic. Both Next.js frontends (web + admin) are thin clients using HttpOnly cookies. No major structural changes — additive AuthModule only.

---

## Stack Decisions

| Decision | Choice | Reason |
|---|---|---|
| Passport strategy | `passport-local` + `passport-google-oauth20` + `passport-jwt` | User-selected Option A |
| Token transport | HttpOnly cookies (`access_token` + `refresh_token`) | Secure, no JS access |
| Access token | JWT, 15-min TTL, signed with `JWT_SECRET` | Stateless per-request auth |
| Refresh token | Random 64-byte hex, 7-day TTL, stored SHA-256 hashed in DB | True revocation, rotation |
| Password hashing | bcrypt (rounds=12) | Battle-tested, available in ecosystem |
| Email provider | Resend via `@nestjs-modules/mailer` + Resend SMTP transport | Simple API key, good free tier |
| Role system | `Role` enum on User (`USER` \| `ADMIN`) | Simplest RBAC for this scope |

---

## Prisma Schema Changes

### Modified: `User`
```prisma
model User {
  id               String    @id @default(uuid())
  email            String    @unique
  name             String?
  passwordHash     String?   // null for OAuth-only users
  role             Role      @default(USER)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  authProviders    AuthProvider[]
  refreshTokens    RefreshToken[]
  passwordResets   PasswordResetToken[]
}

enum Role {
  USER
  ADMIN
}
```

### New: `AuthProvider`
```prisma
model AuthProvider {
  id           String   @id @default(uuid())
  provider     String   // "google"
  providerId   String   // Google sub
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())

  @@unique([provider, providerId])
}
```

### New: `RefreshToken`
```prisma
model RefreshToken {
  id          String   @id @default(uuid())
  tokenHash   String   @unique  // SHA-256 of raw token
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}
```

### New: `PasswordResetToken`
```prisma
model PasswordResetToken {
  id          String   @id @default(uuid())
  tokenHash   String   @unique  // SHA-256 of raw token
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  used        Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## API Endpoints

All under `/auth` prefix, in new `AuthModule`.

| Method | Path | Guard | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Email/password signup, returns tokens |
| POST | `/auth/login` | LocalGuard | Email/password login |
| GET | `/auth/google` | GoogleGuard | Redirect to Google OAuth consent |
| GET | `/auth/google/callback` | GoogleGuard | Handle callback, upsert user, issue tokens |
| POST | `/auth/refresh` | None | Validate refresh cookie, rotate tokens |
| POST | `/auth/logout` | JwtGuard | Clear cookies, invalidate refresh token |
| GET | `/auth/me` | JwtGuard | Return current user object |
| POST | `/auth/forgot-password` | None | Send reset email (always 200 OK) |
| POST | `/auth/reset-password` | None | Validate token, set new password |

### Cookie config (both tokens)
```
HttpOnly: true
Secure: true (production) / false (dev)
SameSite: Lax
Path: /
```

---

## NestJS Module Structure

```
apps/api/src/modules/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  strategies/
    local.strategy.ts
    google.strategy.ts
    jwt.strategy.ts
  guards/
    local-auth.guard.ts
    google-auth.guard.ts
    jwt-auth.guard.ts
    roles.guard.ts
  decorators/
    roles.decorator.ts
    current-user.decorator.ts
  dto/
    register.dto.ts
    login.dto.ts
    forgot-password.dto.ts
    reset-password.dto.ts
  mail/
    mail.module.ts
    mail.service.ts
    templates/
      reset-password.hbs
```

---

## Google OAuth Flow

1. `GET /auth/google` — Passport redirects to Google with `state` param (random CSRF token stored in short-lived cookie)
2. User consents → Google redirects to `GET /auth/google/callback?code=...&state=...`
3. Passport exchanges code for tokens, fetches profile
4. `AuthService.upsertGoogleUser()` — find-or-create user by `AuthProvider.providerId`
5. Issue access + refresh tokens as cookies
6. Redirect to `GOOGLE_CALLBACK_REDIRECT_URL` (configured per-app: web or admin)

**State validation:** Passport's `state` option enabled with a custom `StateStore` backed by a signed cookie.

**Redirect allowlist:** `ALLOWED_REDIRECT_URLS` env var, comma-separated. Validate `redirectTo` query param against this list before redirecting post-login.

---

## Forgot Password Flow

1. `POST /auth/forgot-password { email }` — Always returns `{ message: "If that email exists, a reset link was sent." }` (no enumeration)
2. If user found: generate 32-byte random token, store `SHA-256(token)` + 1-hour expiry in `PasswordResetToken` table
3. Send email via Resend with link: `{WEB_URL}/reset-password?token=<raw_token>`
4. `POST /auth/reset-password { token, newPassword }` — Hash token, look up record, validate not expired + not used, set `passwordHash`, mark token `used=true`
5. Invalidate all refresh tokens for that user (force re-login)
6. Rate limit: 3 requests per email per 15 minutes (using Redis via existing `RedisService`)

---

## Frontend Changes

### Web (`apps/web`)

| File | Change |
|---|---|
| `app/(auth)/signin/page.tsx` | Wire form to `POST /auth/login`, handle errors |
| `app/(auth)/signup/page.tsx` | Wire form to `POST /auth/register` |
| `app/(auth)/forgot-password/page.tsx` | Wire form to `POST /auth/forgot-password`, show success state |
| `app/(auth)/reset-password/page.tsx` | New page — reads `?token`, calls `POST /auth/reset-password` |
| `lib/api.ts` | New — typed fetch wrapper with base URL from env |
| `lib/auth.ts` | New — `getCurrentUser()` calling `GET /auth/me` |
| `app/(auth)/signin/page.tsx` | Add "Continue with Google" button → redirect to `API_URL/auth/google?redirectTo=WEB_URL` |
| `app/dashboard/layout.tsx` | Add server-side auth check via `GET /auth/me`, redirect to `/signin` if 401 |

### Admin (`apps/admin`)

| File | Change |
|---|---|
| `app/(auth)/login/page.tsx` | New — email/password login form (same API endpoint) |
| `app/(auth)/layout.tsx` | New — auth layout |
| `middleware.ts` | New — Next.js middleware, redirect unauthenticated to `/login`, redirect non-ADMIN to `/unauthorized` |
| `app/unauthorized/page.tsx` | New — "Access denied" page |
| `app/page.tsx` | Replace starter with redirect to `/dashboard` |
| `app/dashboard/page.tsx` | New — basic admin dashboard (protected) |
| `lib/api.ts` | New — same pattern as web |

---

## Security Requirements

- All cookies: `HttpOnly`, `Secure` (prod), `SameSite=Lax`
- Google OAuth `state` parameter: signed cookie prevents CSRF
- Redirect URLs validated against allowlist before post-OAuth redirect
- Forgot-password always returns generic message
- Reset tokens: random 32 bytes, stored SHA-256 hashed, 1-hour expiry, single-use, invalidate all refresh tokens on use
- Secrets exclusively from env vars (never hardcoded)
- `@nestjs/throttler` for rate limiting reset requests

---

## Environment Variables

### `apps/api/.env`
```
NODE_ENV=development|production
PORT=3002
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<32+ random bytes>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3002/auth/google/callback
ALLOWED_REDIRECT_URLS=http://localhost:3000,http://localhost:3001
RESEND_API_KEY=re_...
MAIL_FROM=noreply@smatway.com
WEB_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

### `apps/web/.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
PORT=3000
```

### `apps/admin/.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
PORT=3001
```

---

## Google Cloud Console Setup

**Authorized JavaScript Origins:**
- `http://localhost:3002` (dev)
- `https://api.yourdomain.com` (prod)

**Authorized Redirect URIs:**
- `http://localhost:3002/auth/google/callback` (dev)
- `https://api.yourdomain.com/auth/google/callback` (prod)

---

## Test Plan

| Scenario | Expected |
|---|---|
| Register with new email | 201, tokens set in cookies, user in DB |
| Register with duplicate email | 409 Conflict |
| Login valid credentials | 200, tokens set |
| Login wrong password | 401 |
| Google OAuth success (new user) | User created, tokens set, redirect to web |
| Google OAuth success (existing email) | AuthProvider linked to existing user |
| `GET /auth/me` with valid token | 200, user object |
| `GET /auth/me` with no token | 401 |
| `GET /auth/me` with expired token | 401 |
| `POST /auth/refresh` valid cookie | 200, new tokens, old refresh invalidated |
| `POST /auth/refresh` reused token | 401, all user tokens invalidated |
| `POST /auth/logout` | 200, cookies cleared, refresh token deleted |
| Forgot password valid email | 200 generic message, email sent |
| Forgot password unknown email | 200 same generic message (no enumeration) |
| Reset with valid token | 200, password updated, all refresh tokens invalidated |
| Reset with expired token | 400 |
| Reset with used token | 400 |
| Admin route as USER role | 403 or redirect to /unauthorized |
| Admin route as ADMIN role | 200 |

---

## Rollback Notes

- All changes are additive (new AuthModule, new Prisma models, new pages)
- Prisma migration is additive (`ALTER TABLE` adds columns/tables only, no drops)
- Rollback: drop `PasswordResetToken`, `RefreshToken`, `AuthProvider` tables; remove new columns from `User`; remove `AuthModule` from `AppModule.imports`
- Frontend rollback: revert wired pages to their current stub state
