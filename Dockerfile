# ----- #

# Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency specifications and Prisma schema first for layer caching
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

RUN npm ci

# Copy configuration and source code
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Generate Prisma Client into src/generated/prisma and compile NestJS
RUN npm run db:generate
RUN npm run build

# Prune development dependencies to keep runtime image minimal
RUN npm prune --omit=dev

# ----- #

# Production runtime
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Run as unprivileged node user
USER node

# Copy production dependencies, compiled output, and schema
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]
