# Stage 1: Build Svelte frontend
FROM node:20-bookworm-slim as frontend

WORKDIR /frontend

# Copy frontend source code
COPY frontend/package*.json ./
COPY frontend/ ./

# Install dependencies and build the frontend
RUN npm install --legacy-peer-deps && npm run build

# Stage 2: Build Node.js backend
FROM node:20-bookworm-slim as backend

RUN apt-get update -qq \
      && apt-get install -y curl \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend source code
COPY backend/package*.json ./
COPY backend/ ./

# Install dependencies
RUN npm install

# Copy the built Svelte files from the frontend stage
COPY --from=frontend /frontend/build ./public

# Expose the application on port 3001
EXPOSE 3001

# Command to run the backend
CMD ["node", "server.js"]
