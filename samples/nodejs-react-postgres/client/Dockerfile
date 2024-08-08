# Use the slim version of Debian Bookworm as the base image
FROM debian:bookworm-slim

# Set environment variables to avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Argument for API URL
ARG REACT_APP_API_URL=http://localhost:3010

# Update the package list and install Node.js, npm, and any other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && curl -sL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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
