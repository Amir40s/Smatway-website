# Monorepo Migration — Phase 1 Design Spec

**Date:** 2026-04-18
**Project:** smatway
**Scope:** Phase 1 — Turborepo monorepo scaffold only (no Prisma, no auth, no Docker)
**Migration approach:** Option A — in-place restructure

---

## 1. Goals

Convert the existing single Next.js app at the repo root into a Turborepo npm-workspaces monorepo with three apps and three shared packages. Preserve all existing frontend behavior. Preserve git history via `git mv`. Leave Prisma, auth wiring, and Coolify Dockerfiles to future phases.

### Out of scope (Phase 1)

- Prisma / PostgreSQL
- JWT auth or any authentication wiring
- Docker / Coolify Dockerfiles
- Any API endpoints beyond NestJS hello world
- Any admin app UI beyond Next.js starter

---

## 2. Target Structure

```
smatway/                           ← monorepo root (existing repo)
├── apps/
│   ├── web/                       ← existing Next.js app (moved here)
│   ├── admin/                     ← fresh Next.js (create-next-app latest)
│   └── api/                       ← fresh NestJS (nestjs/cli new)
├── packages/
│   ├── types/                     ← @smatway/types (shared TS contracts)
│   ├── tsconfig/                  ← @smatway/tsconfig (shared TS configs)
│   └── eslint-config/             ← @smatway/eslint-config (shared lint rules)
├── turbo.json
├── package.json                   ← workspace root (private)
├── package-lock.json
└── .gitignore                     ← updated for monorepo
```

---

## 3. App Descriptions

### `apps/web`

The existing Next.js 16.2.2 app moved in its entirety. No code changes — only relocation. All current routes, components, and configs move with it.

**Files moved via `git mv` (history-preserving):**

| Source (root) | Destination |
|---|---|
| `app/` | `apps/web/app/` |
| `components/` | `apps/web/components/` |
| `lib/` | `apps/web/lib/` |
| `public/` | `apps/web/public/` |
| `next.config.ts` | `apps/web/next.config.ts` |
| `tsconfig.json` | `apps/web/tsconfig.json` |
| `eslint.config.mjs` | `apps/web/eslint.config.mjs` |
| `postcss.config.mjs` | `apps/web/postcss.config.mjs` |
| `next-env.d.ts` | `apps/web/next-env.d.ts` |
| `components.json` | `apps/web/components.json` |

Note: `tsconfig.tsbuildinfo` is a generated artifact — do not `git mv` it; it will regenerate on first build.

**`apps/web/package.json`** — created from current root `package.json`:
- name: `@smatway/web`
- Keep all existing dependencies unchanged
- Scripts: `dev`, `build`, `start`, `lint`, `typecheck`
- Add `typecheck` script explicitly: `"typecheck": "tsc --noEmit"` (not in original)

### `apps/admin`

Fresh Next.js app scaffolded via:
```bash
npx create-next-app@latest apps/admin \
  --typescript --tailwind --eslint --app \
  --no-src-dir --skip-install \
  --import-alias "@/*"
```

- name: `@smatway/admin`
- No UI customization in Phase 1 — starter content only

### `apps/api`

Fresh NestJS app scaffolded via:
```bash
npx @nestjs/cli new apps/api \
  --package-manager npm \
  --skip-git \
  --skip-install
```

- name: `@smatway/api`
- One `GET /` endpoint returning `{ message: 'Hello World!' }` (NestJS default)
- No modules, no Prisma, no auth in Phase 1

---

## 4. Shared Packages

All packages use the `@smatway/` npm scope.

### `packages/types` — `@smatway/types`

Minimal placeholder to establish the pattern. Extended in future phases.

```ts
// packages/types/index.ts
export type UserRole = 'traveler' | 'transporter' | 'admin'
```

```json
// packages/types/package.json
{
  "name": "@smatway/types",
  "version": "0.0.1",
  "types": "./index.ts",
  "private": true
}
```

Note: `main` is intentionally omitted. This package is type-only — no runtime consumers in Phase 1. Adding a `main` pointing to `.ts` source would break any non-TS consumer. Add a build step + `main: "./dist/index.js"` in Phase 2 when runtime use is needed.

### `packages/tsconfig` — `@smatway/tsconfig`

Three config files:

**`base.json`** — strict TypeScript base:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Base",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

**`nextjs.json`** — extends base, adds Next.js plugin:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "jsx": "preserve",
    "incremental": true
  }
}
```

**`nestjs.json`** — extends base, targets Node:
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "NestJS",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node",
    "noEmit": false,
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

**`packages/tsconfig/package.json`:**
```json
{
  "name": "@smatway/tsconfig",
  "version": "0.0.1",
  "private": true,
  "files": ["base.json", "nextjs.json", "nestjs.json"]
}
```

Apps reference shared configs. Each app's `tsconfig.json` adds `extends` but keeps its own app-specific `paths`, `include`, and overrides. The shared tsconfig provides only the base compiler options — it does not replace app configs:

```json
// apps/web/tsconfig.json — add extends, keep existing paths/@/* and plugins
{
  "extends": "@smatway/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
// apps/api/tsconfig.json — NestJS CLI generates this; update extends only
{ "extends": "@smatway/tsconfig/nestjs.json", ... }
```

### `packages/eslint-config` — `@smatway/eslint-config`

Two separate config files (not a single index.js), one per app type. Apps import the file they need directly:

- `next.js` — flat config object extending `eslint-config-next/core-web-vitals`
- `nest.js` — flat config object with `@typescript-eslint` rules for Node

```js
// packages/eslint-config/next.js
const { FlatCompat } = require('@eslint/eslintrc')
const compat = new FlatCompat()
module.exports = compat.extends('next/core-web-vitals')
```

Usage in `apps/web/eslint.config.mjs`:
```js
import nextConfig from '@smatway/eslint-config/next.js'
export default [...nextConfig]
```

**`packages/eslint-config/package.json`:**
```json
{
  "name": "@smatway/eslint-config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./next.js": "./next.js",
    "./nest.js": "./nest.js"
  }
}
```

Note: In Phase 1 both apps can keep their scaffolded ESLint configs as-is. Migrating to shared config is optional and can be done in a follow-on cleanup.

---

## 5. Root `package.json`

```json
{
  "name": "smatway",
  "version": "0.0.1",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":       "turbo run dev",
    "build":     "turbo run build",
    "lint":      "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

Root has **no app dependencies** — only `turbo` as a dev dependency.

---

## 6. `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

Note: `typecheck` depends on `^typecheck` (not `^build`) per design decision.

---

## 7. `.gitignore` Updates

Add to existing `.gitignore` at monorepo root:

```gitignore
# Turborepo
.turbo

# Build outputs (all apps)
apps/*/.next
apps/*/dist
apps/*/.next/cache

# Nested node_modules
apps/*/node_modules
packages/*/node_modules
```

---

## 8. Exact Command Sequence

> **Shell requirement:** All commands below use bash syntax. On Windows, run them in **Git Bash** or **WSL2** — not PowerShell or cmd. Git Bash ships with Git for Windows and is available in VS Code's integrated terminal. PowerShell equivalents are provided in the comment blocks where syntax differs.

```bash
# ── Step 1: Create directory structure ──────────────────────────────────────
# bash (Git Bash / WSL):
mkdir -p apps/web apps/admin apps/api packages/types packages/tsconfig packages/eslint-config
# PowerShell equivalent:
# New-Item -ItemType Directory -Force apps/web, apps/admin, apps/api, packages/types, packages/tsconfig, packages/eslint-config

# ── Step 2: Move existing web app files (git mv preserves history) ──────────
git mv app              apps/web/app
git mv components       apps/web/components
git mv lib              apps/web/lib
git mv public           apps/web/public
git mv next.config.ts   apps/web/next.config.ts
git mv tsconfig.json    apps/web/tsconfig.json
git mv eslint.config.mjs apps/web/eslint.config.mjs
git mv postcss.config.mjs apps/web/postcss.config.mjs
git mv next-env.d.ts    apps/web/next-env.d.ts
git mv components.json  apps/web/components.json
# Note: do NOT git mv tsconfig.tsbuildinfo — it is a generated artifact
# PowerShell equivalent for git mv: git mv works the same in PowerShell (git commands are cross-platform)

# ── Step 3: Create apps/web/package.json ────────────────────────────────────
# (written manually — derived from existing root package.json, name @smatway/web)

# ── Step 4: Rewrite root package.json ───────────────────────────────────────
# (written manually — private workspace root, turbo only)

# ── Step 5: Write turbo.json ─────────────────────────────────────────────────
# (written manually per Section 6)

# ── Step 6: Write shared packages ───────────────────────────────────────────
# packages/tsconfig/{package.json, base.json, nextjs.json, nestjs.json}
# packages/eslint-config/{package.json, next.js, nest.js}   ← NOT index.js
# packages/types/{package.json, index.ts}

# ── Step 7: Scaffold admin (skip-install) ───────────────────────────────────
npx create-next-app@latest apps/admin \
  --typescript --tailwind --eslint --app \
  --no-src-dir --skip-install \
  --import-alias "@/*"

# ── Step 8: Scaffold api (skip-install) ─────────────────────────────────────
npx @nestjs/cli new apps/api \
  --package-manager npm \
  --skip-git \
  --skip-install

# ── Step 9: Single npm install at monorepo root ──────────────────────────────
npm install

# ── Step 10: Verify ──────────────────────────────────────────────────────────
turbo run build
```

---

## 9. Validation Checklist

- [ ] `npm install` completes at root with no errors
- [ ] `turbo run build` builds all three apps (web, admin, api)
- [ ] `apps/web` build output identical to pre-migration build
- [ ] `apps/admin` starts on `npm run dev` in its own terminal
- [ ] `apps/api` starts and `GET /` returns `{ "message": "Hello World!" }`
- [ ] `@smatway/types`, `@smatway/tsconfig`, `@smatway/eslint-config` resolve correctly
- [ ] No root-level Next.js or NestJS source files remain (only `turbo.json`, `package.json`, `.gitignore`, docs)
- [ ] `git log --follow apps/web/app/layout.tsx` shows pre-migration history

---

## 10. Deployment Continuity Note

> **Action required before merging to production:**
> The existing Coolify deployment points to the repo root as the Next.js source. After this migration, the build source moves to `apps/web/`. The Coolify service config (build context and/or Nixpacks root directory) must be updated to `apps/web` before or simultaneously with the code cutover to avoid a broken deployment.

Steps:
1. In Coolify, update the build source path for the `web` service from `/` to `/apps/web`
2. Update `nixpacks.toml` path if used
3. Merge migration branch and trigger a fresh build in Coolify to confirm
4. Only then decommission the old root-level config

---

## 11. Future Phases (out of scope here)

- **Phase 2:** Prisma + PostgreSQL schema (users, routes, vehicles, bookings, payments)
- **Phase 3:** JWT auth in `apps/api`, auth pages in `apps/web` wired to real API
- **Phase 4:** Dockerfiles per app + `docker-compose.yml` for local dev
- **Phase 5:** Coolify multi-service deployment (separate domains for web/api/admin)
