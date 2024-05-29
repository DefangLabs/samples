FROM node:20 as build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN ls -l .svelte-kit/output

FROM node:20-slim

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json /app/package-lock.json ./

RUN npm ci --omit dev

EXPOSE 3000

CMD ["node", "build"]