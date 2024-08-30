FROM node:20-bookworm-slim

# Install curl
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Set correct permissions
RUN chown -R node:node /app

RUN npm run build

EXPOSE 3000

# Switch to non-root user
USER node

CMD ["npm", "start"]