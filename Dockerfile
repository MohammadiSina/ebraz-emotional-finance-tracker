# -----------------------------
# Base (tooling only)
# -----------------------------
FROM node:24-alpine AS base
WORKDIR /app

# Enable pnpm via corepack (no global installs)
RUN corepack enable


# -----------------------------
# Dependencies (cached)
# -----------------------------
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install ALL deps once (needed for build + prisma generate)
RUN pnpm install --frozen-lockfile


# -----------------------------
# Build
# -----------------------------
FROM deps AS build

# Prisma needs OpenSSL on Alpine
RUN apk add --no-cache openssl

COPY tsconfig*.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma artifacts (generated/)
RUN pnpm exec prisma generate

# Build application
RUN pnpm build


# -----------------------------
# Prune to production deps
# -----------------------------
FROM deps AS prune

# Remove devDependencies, keep runtime-safe node_modules
RUN pnpm prune --prod && pnpm store prune


# -----------------------------
# Runtime
# -----------------------------
FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Runtime requirements for Prisma
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

# Copy production node_modules only
COPY --from=prune --chown=app:app /app/node_modules ./node_modules

# Copy built app + Prisma runtime artifacts
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/generated ./generated

# Minimal metadata
COPY package.json ./

USER app

EXPOSE 3000

# Apply migrations, then start
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]