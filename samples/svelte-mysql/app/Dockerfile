# Stage 1: Build Svelte frontend
FROM debian:bookworm-slim as frontend

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install curl and Node.js 16.x
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /frontend

# Copy frontend source code
COPY frontend/package*.json ./
COPY frontend/ ./

# Install dependencies and build the frontend
RUN npm install --legacy-peer-deps && npm run build

# Stage 2: Build Node.js backend
FROM debian:bookworm-slim as backend

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install curl and Node.js 16.x
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
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

# Copy the backend source code
COPY backend/ .

# Expose the application on port 3001
EXPOSE 3001

# Command to run the backend
CMD ["node", "server.js"]
