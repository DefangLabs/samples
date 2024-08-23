# Use the slim version of Node.js on Debian Bookworm as the base image
FROM node:20-bookworm-slim

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Argument for API URL
ARG REACT_APP_API_URL=http://localhost:3010

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json into the container at /app
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the current directory contents into the container at /app
COPY . .

# Build the React application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Command to serve the built React app
CMD ["npx", "serve", "-s", "build"]
