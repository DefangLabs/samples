FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apk add --no-cache curl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/lib/schema.sql ./lib/schema.sql

USER nextjs
EXPOSE 3000

# Docker/Fargate inject HOSTNAME=<container hostname> at runtime, overriding the
# ENV above. Next's standalone server binds to $HOSTNAME, so it would listen only
# on the task's ENI IP and the `curl localhost` container health check would fail.
# Re-force 0.0.0.0, then `exec` so node stays PID 1 and receives SIGTERM directly.
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
