# `mastra build --studio` produces a self-contained Node.js server in
# .mastra/output — the agent API and the Studio UI on one port. Only that
# directory reaches the final image, so the toolchain and the TypeScript
# sources stay out of production.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4111
# Tells the server where to find the Studio single-page app it should serve.
ENV MASTRA_STUDIO_PATH=/app/.mastra/output/studio

# curl backs the container health check that Defang requires on ingress ports.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/.mastra/output ./.mastra/output

USER node
EXPOSE 4111

CMD ["node", ".mastra/output/index.mjs"]
