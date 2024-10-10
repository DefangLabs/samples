# Use slim version of Node.js v20 on Debian Bookworm as base image 
FROM node:20-bookworm-slim

# Install curl for healthchecks testing 
RUN apt-get update -qq \
      && apt-get install -y curl \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

# Set working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of your application's code
COPY . .

# Expose the port your app runs on
EXPOSE 5173

# Command to run the app when container is finished launch
CMD ["npm", "run", "dev"]
