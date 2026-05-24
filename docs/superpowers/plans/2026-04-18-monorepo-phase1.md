# Monorepo Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing single Next.js app at repo root into a Turborepo npm-workspaces monorepo with apps/web (migrated), apps/admin (fresh Next.js), apps/api (fresh NestJS hello-world), and shared packages/types, tsconfig, eslint-config.

**Architecture:** In-place restructure — existing repo root becomes the monorepo root. Existing app files move to `apps/web/` via `git mv` to preserve history. New apps are scaffolded via official CLIs with `--skip-install`, then a single `npm install` at root wires all workspaces together. Shared packages are hand-authored (minimal stubs only).

**Tech Stack:** Turborepo, npm workspaces, Next.js 16.2.2 (web), Next.js latest (admin), NestJS (api), TypeScript 5

**Spec:** `docs/superpowers/specs/2026-04-18-monorepo-phase1-design.md`

> **Shell requirement:** Run all commands in **Git Bash** or **WSL2** on Windows — not PowerShell. Git Bash ships with Git for Windows and is the default terminal in VS Code when Git for Windows is installed.

---

## Task 1: Pre-flight checks

**Files:** none modified

- [ ] **Step 1.1: Confirm git working tree is clean**

```bash
git status
```

Expected: `nothing to commit, working tree clean`
If not clean: stash or commit outstanding changes before proceeding.

- [ ] **Step 1.2: Confirm you are on master branch**

```bash
git branch --show-current
```

Expected: `master`

- [ ] **Step 1.3: Record current build works (baseline)**

```bash
npm run build
```

Expected: Next.js build completes with no errors. Note the output size for comparison after migration.

---

## Task 2: Create monorepo directory structure

**Files:** directories only — no file content yet

- [ ] **Step 2.1: Create all required directories in one command**

```bash
mkdir -p apps/web apps/admin apps/api packages/types packages/tsconfig packages/eslint-config
```

Expected: directories created, no errors.

- [ ] **Step 2.2: Verify structure**

```bash
ls apps/ && ls packages/
```

Expected:
```
admin  api  web
eslint-config  tsconfig  types
```

---

## Task 3: Rewrite root `package.json` as workspace root

**Files:**
- Modify: `package.json`

The root package.json must become a workspace root — no app dependencies, only `turbo` as devDependency.

- [ ] **Step 3.1: Overwrite root package.json**

Replace the entire file with:

```json
{
  "name": "smatway",
  "version": "0.0.1",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

- [ ] **Step 3.2: Verify the file is valid JSON**

```bash
node -e "require('./package.json'); console.log('valid')"
```

Expected: `valid`

---

## Task 4: Create `turbo.json`

**Files:**
- Create: `turbo.json`

- [ ] **Step 4.1: Write turbo.json at repo root**

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

- [ ] **Step 4.2: Verify valid JSON**

```bash
node -e "require('./turbo.json'); console.log('valid')"
```

Expected: `valid`

---

## Task 5: Create `packages/tsconfig`

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/nextjs.json`
- Create: `packages/tsconfig/nestjs.json`

- [ ] **Step 5.1: Write `packages/tsconfig/package.json`**

```json
{
  "name": "@smatway/tsconfig",
  "version": "0.0.1",
  "private": true,
  "files": ["base.json", "nextjs.json", "nestjs.json"]
}
```

- [ ] **Step 5.2: Write `packages/tsconfig/base.json`**

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

- [ ] **Step 5.3: Write `packages/tsconfig/nextjs.json`**

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

- [ ] **Step 5.4: Write `packages/tsconfig/nestjs.json`**

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

---

## Task 6: Create `packages/types`

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/index.ts`

- [ ] **Step 6.1: Write `packages/types/package.json`**

```json
{
  "name": "@smatway/types",
  "version": "0.0.1",
  "private": true,
  "types": "./index.ts"
}
```

Note: No `main` field — this is type-only in Phase 1. Runtime entrypoint (`dist/index.js`) added in Phase 2.

- [ ] **Step 6.2: Write `packages/types/index.ts`**

```ts
// Shared type contracts — Phase 1 placeholder
// Extend this file when api/web/admin start sharing DTOs (Phase 2+)

export type UserRole = 'traveler' | 'transporter' | 'admin'
```

---

## Task 7: Create `packages/eslint-config`

**Files:**
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/next.js`
- Create: `packages/eslint-config/nest.js`

- [ ] **Step 7.1: Write `packages/eslint-config/package.json`**

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

- [ ] **Step 7.2: Write `packages/eslint-config/next.js`**

```js
const { FlatCompat } = require('@eslint/eslintrc')
const compat = new FlatCompat({ baseDirectory: __dirname })

module.exports = compat.extends('next/core-web-vitals')
```

- [ ] **Step 7.3: Write `packages/eslint-config/nest.js`**

```js
module.exports = [
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
```

Note: In Phase 1 both `apps/web` and `apps/api` keep their scaffolded ESLint configs as-is. These shared configs are available but not yet consumed — migration is a Phase 2 cleanup task.

---

## Task 8: Update `.gitignore`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 8.1: Append monorepo patterns to existing `.gitignore`**

Add the following block at the end of the existing `.gitignore`:

```gitignore
# Turborepo
.turbo

# Monorepo build outputs
apps/*/.next
apps/*/dist
apps/*/.next/cache

# Nested node_modules (hoisted to root by npm workspaces)
apps/*/node_modules
packages/*/node_modules
```

---

## Task 9: Move existing web app files via `git mv`

**Files:**
- `git mv` × 10 source items → `apps/web/`

This preserves git history. Run each command individually — do not glob.

- [ ] **Step 9.1: Move source directories and config files**

```bash
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
```

Do NOT move `tsconfig.tsbuildinfo` — it is a generated artifact and will regenerate.

- [ ] **Step 9.2: Verify moves staged correctly**

```bash
git status --short | head -30
```

Expected: each moved file shows as `R  <old-path> -> apps/web/<file>` (renamed). No unexpected deletions.

- [ ] **Step 9.3: Verify history is preserved on a sample file**

```bash
git log --follow --oneline apps/web/app/layout.tsx | head -5
```

Expected: shows commits from before the move (not just the rename commit).

---

## Task 10: Create `apps/web/package.json`

**Files:**
- Create: `apps/web/package.json`

This is derived from the original root `package.json` (which is now the workspace root). All existing app dependencies move here.

- [ ] **Step 10.1: Write `apps/web/package.json`**

```json
{
  "name": "@smatway/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@base-ui/react": "^1.3.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.8.0",
    "motion": "^12.38.0",
    "next": "16.2.2",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.2",
    "shadcn": "^4.2.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## Task 11: Update `apps/web/tsconfig.json`

**Files:**
- Modify: `apps/web/tsconfig.json`

Add `extends` pointing to the shared tsconfig. Keep existing `paths`, `plugins`, `include`, and `exclude` intact.

- [ ] **Step 11.1: Update `apps/web/tsconfig.json`**

Replace the file with:

```json
{
  "extends": "@smatway/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

Note: `plugins` and `incremental` are now inherited from `@smatway/tsconfig/nextjs.json`. The `paths` alias `@/*` must stay here (app-specific, not shared).

---

## Task 12: Scaffold `apps/admin`

**Files:**
- Create: `apps/admin/` (entire directory via CLI)

- [ ] **Step 12.1: Run create-next-app with skip-install**

```bash
npx create-next-app@latest apps/admin \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --skip-install \
  --import-alias "@/*"
```

When prompted for project name: it should use `apps/admin` as the directory. If the CLI asks interactive questions, answer: TypeScript=Yes, Tailwind=Yes, ESLint=Yes, App Router=Yes, src/=No, import alias=`@/*`.

- [ ] **Step 12.2: Update apps/admin/package.json name**

Open `apps/admin/package.json` and change the `name` field to:

```json
"name": "@smatway/admin"
```

Add `typecheck` script if not present:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 12.3: Remove any lockfile created by scaffolder**

```bash
rm -f apps/admin/package-lock.json apps/admin/yarn.lock apps/admin/pnpm-lock.yaml
```

Expected: silent success (files may not exist).

---

## Task 13: Scaffold `apps/api`

**Files:**
- Create: `apps/api/` (entire directory via CLI)

- [ ] **Step 13.1: Run NestJS CLI with skip-install**

```bash
npx @nestjs/cli new apps/api \
  --package-manager npm \
  --skip-git \
  --skip-install
```

If the CLI prompts for package manager selection, choose `npm`.

- [ ] **Step 13.2: Update apps/api/package.json name**

Open `apps/api/package.json` and change the `name` field to:

```json
"name": "@smatway/api"
```

- [ ] **Step 13.3: Update apps/api/tsconfig.json to use shared config**

Replace `apps/api/tsconfig.json` with:

```json
{
  "extends": "@smatway/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

- [ ] **Step 13.4: Remove any lockfile created by scaffolder**

```bash
rm -f apps/api/package-lock.json apps/api/yarn.lock apps/api/pnpm-lock.yaml
```

Expected: silent success.

---

## Task 14: Root lockfile hygiene

**Goal:** One `package-lock.json` at the repo root. No nested lockfiles anywhere.

- [ ] **Step 14.1: Scan for any remaining nested lockfiles**

```bash
find . -name "package-lock.json" -not -path "./node_modules/*" -not -path "./.git/*"
find . -name "yarn.lock" -not -path "./node_modules/*" -not -path "./.git/*"
find . -name "pnpm-lock.yaml" -not -path "./node_modules/*" -not -path "./.git/*"
```

Expected: only `./package-lock.json` (if it exists already from before). Any nested lockfile found must be deleted.

- [ ] **Step 14.2: Delete any nested lockfiles found**

```bash
# Example if apps/admin/package-lock.json was found:
rm -f apps/admin/package-lock.json
rm -f apps/api/package-lock.json
# Repeat for any others found in Step 14.1
```

- [ ] **Step 14.3: Also delete root package-lock.json (it will regenerate)**

```bash
rm -f package-lock.json
```

This forces `npm install` in the next step to generate a fresh lockfile that accounts for all workspaces.

---

## Task 15: Install dependencies

- [ ] **Step 15.1: Run single npm install at monorepo root**

```bash
npm install
```

Expected: npm resolves all workspaces, hoists shared dependencies to root `node_modules/`, creates a single `package-lock.json` at root. This may take 1-3 minutes.

- [ ] **Step 15.2: Verify only one lockfile exists**

```bash
find . -name "package-lock.json" -not -path "./node_modules/*" -not -path "./.git/*"
```

Expected: exactly one result — `./package-lock.json`.

- [ ] **Step 15.3: Verify workspace packages are linked**

```bash
ls node_modules/@smatway/
```

Expected: `eslint-config  tsconfig  types` (symlinks to `packages/*`).

---

## Task 16: Verification — root workspace

- [ ] **Step 16.1: Install turbo globally for direct CLI use (if not already installed)**

```bash
npx turbo --version
```

Expected: prints a version like `2.x.x`. If it errors, run `npm install` again.

- [ ] **Step 16.2: Type-check all packages**

```bash
npx turbo run typecheck
```

Expected: all three apps complete typecheck with no errors. If `apps/web` fails, check that `apps/web/tsconfig.json` paths and extends are correct.

- [ ] **Step 16.3: Build all apps**

```bash
npx turbo run build
```

Expected: all three apps build successfully.
- `apps/web` → `.next/` standalone output
- `apps/admin` → `.next/` output
- `apps/api` → `dist/` output

If any app fails, see Task 17 (per-app smoke checks) to isolate which one.

---

## Task 17: Per-app smoke checks

Run these in separate terminals, or sequentially:

- [ ] **Step 17.1: Smoke-check apps/web**

```bash
cd apps/web && npm run build
```

Expected: Next.js build completes. Output should be identical (same routes, same page count) as the baseline recorded in Task 1.3.

- [ ] **Step 17.2: Smoke-check apps/admin**

```bash
cd apps/admin && npm run build
```

Expected: Next.js build for the starter app completes with no errors.

- [ ] **Step 17.3: Smoke-check apps/api**

```bash
cd apps/api && npm run build && npm run start &
sleep 3
curl http://localhost:3000/
```

Expected response:
```json
{"message":"Hello World!"}
```

Kill the background process after verifying:
```bash
kill %1
```

- [ ] **Step 17.4: Verify git history preserved on a key web file**

```bash
git log --follow --oneline apps/web/app/layout.tsx | head -5
```

Expected: shows pre-migration commits (not just the rename commit from this migration).

- [ ] **Step 17.5: Verify no root-level Next.js source files remain**

```bash
ls app/ 2>/dev/null && echo "ERROR: app/ still at root" || echo "OK: app/ moved"
ls components/ 2>/dev/null && echo "ERROR: components/ still at root" || echo "OK: components/ moved"
ls next.config.ts 2>/dev/null && echo "ERROR: next.config.ts still at root" || echo "OK: moved"
```

Expected: all three print `OK: ...moved`.

---

## Task 18: Final commit

- [ ] **Step 18.1: Stage all changes**

```bash
git add -A
git status
```

Review the status output before committing. Confirm:
- `apps/web/` contains all moved files (shown as renamed)
- `apps/admin/` and `apps/api/` are new
- `packages/` is new
- Root `package.json`, `turbo.json`, `.gitignore` are modified
- No unexpected files staged

- [ ] **Step 18.2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: migrate to Turborepo monorepo (Phase 1)

- Move existing Next.js app to apps/web (git mv, history preserved)
- Scaffold apps/admin (Next.js latest starter)
- Scaffold apps/api (NestJS hello-world)
- Add packages/tsconfig, packages/types, packages/eslint-config
- Wire npm workspaces at root with single package-lock.json
- Add turbo.json with build/dev/lint/typecheck pipeline

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: Coolify deployment continuity

> **This task is a manual action in Coolify — not a code change.**

After merging this branch, the existing production deployment **will break** unless updated. The Coolify service for `web` currently uses the repo root as its build source. The Next.js app is now at `apps/web/`.

- [ ] **Step 19.1: Log into Coolify and open the web service**

Navigate to your Coolify instance → the smatway `web` service.

- [ ] **Step 19.2: Update the build source path**

Change the **Base Directory** (or equivalent field) from:
```
/
```
to:
```
/apps/web
```

If the service uses Nixpacks, also move `nixpacks.toml` to `apps/web/`:
```bash
git mv nixpacks.toml apps/web/nixpacks.toml
git commit -m "chore: move nixpacks.toml to apps/web for Coolify"
```

- [ ] **Step 19.3: Trigger a fresh deploy in Coolify**

Push the migration branch and trigger a manual deploy. Confirm the build succeeds before closing out this task.

- [ ] **Step 19.4: Confirm production web app is live**

Visit the production URL and confirm the marketing page and dashboard routes load correctly.

---

## Validation Checklist (final gate)

- [ ] `npm install` completed at root with no errors
- [ ] Single `./package-lock.json` — no nested lockfiles anywhere
- [ ] `npx turbo run build` — all three apps build successfully
- [ ] `apps/web` build output matches pre-migration baseline (same routes)
- [ ] `GET http://localhost:3000/` on `apps/api` returns `{"message":"Hello World!"}`
- [ ] `apps/admin` build completes with no errors
- [ ] `@smatway/types`, `@smatway/tsconfig`, `@smatway/eslint-config` symlinked in `node_modules/@smatway/`
- [ ] No root-level `app/`, `components/`, `lib/`, `next.config.ts` remain
- [ ] `git log --follow apps/web/app/layout.tsx` shows pre-migration history
- [ ] Coolify build source updated to `/apps/web`
- [ ] Production deploy verified live
