# Use the slim version of Node.js v20 on Debian Bookworm as the base image
FROM node:20-bookworm-slim

RUN apt-get update -qq \
      && apt-get install -y curl \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the SvelteKit application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "build"]
