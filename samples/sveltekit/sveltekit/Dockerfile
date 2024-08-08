# Stage 1: Build the application
FROM debian:bookworm-slim as build

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install curl and Node.js 20.x
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# List the contents of the build directory for verification
RUN ls -l .svelte-kit/output

# Stage 2: Run the application
FROM debian:bookworm-slim

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install curl and Node.js 20.x
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built application and package files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package.json /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "build"]
