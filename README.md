This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Coolify (Separate Resources)

This monorepo is deployed as separate Coolify apps and infrastructure resources.

Deploy these as independent resources:

1. web (Next.js frontend)
2. admin (Next.js admin panel)
3. api (NestJS backend)
4. postgres (database)
5. redis (cache)

Do not use localhost in production environment variables. Use Coolify internal hostnames or public domains as appropriate.

### Resource Order

1. Deploy postgres and redis first.
2. Deploy api second.
3. Deploy web and admin after api is healthy.

### 1) Deploy web

Coolify settings:

- Build Pack: Dockerfile
- Base Directory: /apps/web
- Dockerfile Location: Dockerfile
- Port Exposes: 3000
- Pre-deployment command: empty
- Post-deployment command: empty

Environment variables:

- NEXT_PUBLIC_API_BASE_URL=https://your-api-domain
- NEXT_TELEMETRY_DISABLED=1
- PORT=3000
- NODE_ENV=production

Buildtime and Runtime flags:

- NODE_ENV: Runtime only
- PORT: Runtime only
- NEXT_PUBLIC_API_BASE_URL: Buildtime and Runtime
- NEXT_TELEMETRY_DISABLED: Buildtime and Runtime

### 2) Deploy admin

Coolify settings:

- Build Pack: Dockerfile
- Base Directory: /apps/admin
- Dockerfile Location: Dockerfile
- Port Exposes: 3001
- Pre-deployment command: empty
- Post-deployment command: empty

Environment variables:

- NEXT_PUBLIC_API_BASE_URL=https://your-api-domain
- NEXT_TELEMETRY_DISABLED=1
- PORT=3001
- NODE_ENV=production

Buildtime and Runtime flags:

- NODE_ENV: Runtime only
- PORT: Runtime only
- NEXT_PUBLIC_API_BASE_URL: Buildtime and Runtime
- NEXT_TELEMETRY_DISABLED: Buildtime and Runtime

### 3) Deploy api

Coolify settings:

- Build Pack: Dockerfile
- Base Directory: /apps/api
- Dockerfile Location: Dockerfile
- Port Exposes: 3002
- Pre-deployment command: npm run prisma:migrate:deploy
- Post-deployment command: empty

Environment variables:

- NODE_ENV=production
- PORT=3002
- DATABASE_URL=postgresql://USER:PASSWORD@POSTGRES_HOST:5432/DB_NAME?schema=public
- REDIS_URL=redis://default:PASSWORD@REDIS_HOST:6379/0

Buildtime and Runtime flags:

- NODE_ENV: Runtime only
- PORT: Runtime only
- DATABASE_URL: Runtime only
- REDIS_URL: Runtime only

Health check:

- Path: /health
- Port: 3002

### Verification Checklist

After deployment:

1. API responds on /health.
2. Web loads without server errors and calls the deployed API URL.
3. Admin loads and calls the deployed API URL.
4. Prisma migrations run successfully in API pre-deployment logs.

### Common Pitfalls

1. Do not set NODE_ENV as Buildtime in Coolify. This can skip devDependencies needed for build tooling.
2. Do not keep Laravel or unrelated commands in pre-deployment fields.
3. Keep Dockerfile Location as Dockerfile (no leading slash when Base Directory is set).
4. Use separate ports per service: web 3000, admin 3001, api 3002.

## Local Infra (Postgres + Redis Only)

This repo includes `docker-compose.infra.yml` to run only Postgres and Redis locally.

From the repository root:

```bash
npm run infra:up
npm run infra:logs
npm run infra:down
```

Reset local database/cache volumes when needed:

```bash
npm run infra:reset
```

Default local API env values:

- `DATABASE_URL=postgresql://smatway:smatway@localhost:5432/smatway?schema=public`
- `REDIS_URL=redis://localhost:6379`
- `PORT=3002`
- `NODE_ENV=development`

Web/Admin local env values:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3002`
- `PORT=3000` for web
- `PORT=3001` for admin

## Example Env Files

Use these as reference templates for local development and Coolify variable names:

- apps/api/.env.example
- apps/web/.env.example
- apps/admin/.env.example

 # Garage Setup Hosted 
 # Postgree error Resolved 
 ```Pre-Deployment-Command
 npx prisma migrate resolve --rolled-back 20260421172301_add_profile_models && npx prisma db push && npx prisma migrate resolve --applied 20260421172301_add_profile_models
 ```
 ```
 npm run prisma:migrate:deploy
 ```