# A sample dockerfile for a Node.js application.
# Replace with an appropriate Dockerfile for your application.

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]