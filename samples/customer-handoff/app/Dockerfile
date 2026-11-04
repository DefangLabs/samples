FROM node:22-alpine

WORKDIR /app

COPY --chown=node:node package.json server.js portal-client.js ./
COPY --chown=node:node public ./public

ENV NODE_ENV=production
USER node

EXPOSE 8080

CMD ["node", "server.js"]
