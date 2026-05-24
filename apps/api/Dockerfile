FROM node:24-bookworm-slim AS deps
WORKDIR /app

# OpenSSL is required by Prisma's query engine. The bookworm-slim base image
# ships without it, which causes prisma:warn at migrate time and an outright
# failure at `prisma generate` during the build. Install it explicitly.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies from app-local package manifest.
COPY package*.json ./
RUN npm install --no-audit --no-fund

FROM node:24-bookworm-slim AS builder
WORKDIR /app

# Same — needed for `prisma generate` to find a matching engine binary.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app

# And once more for the runtime: Prisma's client loads the engine at boot.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3002

RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

# Runtime needs dist plus Prisma schema/migrations and installed modules.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules

USER nestjs

EXPOSE 3002

CMD ["npm", "run", "start:prod"]
