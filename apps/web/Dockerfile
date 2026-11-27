# Build
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace @wildlife-monitor/web --include-workspace-root=false

COPY apps/web ./apps/web

ARG VITE_API_MOCKS=true
RUN npm run build --workspace @wildlife-monitor/web

# ----- #

# Serve
FROM nginxinc/nginx-unprivileged:1.30-alpine AS runner

ENV API_UPSTREAM=http://api:3000

COPY apps/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080
