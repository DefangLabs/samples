FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
RUN npx mastra build
RUN apk add --no-cache gcompat

RUN addgroup -g 1001 -S nodejs && \
  adduser -S mastra -u 1001 && \
  chown -R mastra:nodejs /app

USER mastra

ENV PORT=8080
ENV NODE_ENV=production
ENV READINESS_CHECK_PATH="/api"

EXPOSE 8080

CMD ["node", "--import=./.mastra/output/instrumentation.mjs", ".mastra/output/index.mjs"]