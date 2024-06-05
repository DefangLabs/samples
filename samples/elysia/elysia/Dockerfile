FROM oven/bun:1.1-slim as bun-base

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install


FROM bun-base as production

COPY package.json bun.lockb ./
RUN bun install --production

COPY src src
COPY tsconfig.json ./

ENV NODE_ENV=production

CMD [ "bun", "src/index.ts" ]