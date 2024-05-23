# Use the official Node.js image
FROM node:20-alpine

# Create and change to the app directory
WORKDIR /app

# Copy application dependency manifests to the container image.
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the local code to the container image
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Run the web service on container startup.
CMD ["node", "server.js"]
