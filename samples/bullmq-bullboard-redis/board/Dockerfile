# Use the slim version of Node.js on Debian Bookworm as the base image
FROM node:20-bookworm-slim

# Install tools for healthcheck
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using npm ci for a clean install
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Define the command to run the application
CMD ["node", "index.mjs"]
