# Use the slim version of Node.js on Debian Bookworm as the base image
FROM node:bookworm-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install Sails.js globally
RUN npm install -g sails

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the application port
EXPOSE 1337

# Start the Sails.js application
CMD ["sails", "lift"]
