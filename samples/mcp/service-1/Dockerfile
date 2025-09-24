FROM node:bookworm-slim

RUN apt-get update && apt-get install -y curl && apt-get clean

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "start" ]