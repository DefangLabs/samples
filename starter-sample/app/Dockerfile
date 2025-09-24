# A sample dockerfile for a Node.js application.
# Replace with an appropriate Dockerfile for your sample.
#REMOVE_ME_AFTER_EDITING

FROM node:20-bookworm-slim

RUN apt-get update -qq \ 
    && apt-get install -y curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]