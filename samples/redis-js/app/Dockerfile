# Use Node.js as the base image
FROM node:22-alpine

# Set working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the Node.js app
CMD ["node", "server.js"]
