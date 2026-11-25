# Build context: repository root (npm workspaces share the root lockfile).
#   docker build -f apps/api/Dockerfile .

# ----- #

# Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency specifications and Prisma schema first for layer caching
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/prisma.config.ts ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

RUN npm ci --workspace @wildlife-monitor/api --include-workspace-root=false

# Copy configuration and source code
COPY apps/api/tsconfig*.json apps/api/nest-cli.json ./apps/api/
COPY apps/api/src ./apps/api/src

# Generate Prisma Client into src/generated/prisma and compile NestJS
RUN npm run db:generate --workspace @wildlife-monitor/api
RUN npm run build --workspace @wildlife-monitor/api

# Prune development dependencies to keep runtime image minimal
RUN npm prune --omit=dev --workspace @wildlife-monitor/api --include-workspace-root=false

# ----- #

# Production runtime
FROM node:24-alpine AS runner

WORKDIR /app/apps/api
ENV NODE_ENV=production

# Run as unprivileged node user
USER node

# Copy production dependencies (hoisted to the root), compiled output, and schema
COPY --chown=node:node --from=builder /app/node_modules /app/node_modules
COPY --chown=node:node apps/api/package.json ./
COPY --chown=node:node --from=builder /app/apps/api/dist ./dist
COPY --chown=node:node --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]
