FROM node:20-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN corepack enable pnpm && pnpm install --frozen-lockfile --prefer-offline

COPY src ./src
COPY public ./public
COPY next.config.ts .
COPY tsconfig.json .

RUN pnpm run build