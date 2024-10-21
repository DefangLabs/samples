# Use the slim version of Node.js on Debian Bookworm as the base image
FROM node:20-bookworm-slim

RUN apt-get update -qq \
      && apt-get install -y curl \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install Sails.js globally
RUN npm install -g sails

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 1337

# Command to run the application
CMD ["sails", "lift"]
