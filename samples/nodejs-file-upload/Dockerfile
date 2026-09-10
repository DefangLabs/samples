# Use an official Node runtime based on slim as a parent image
FROM node:20-slim

# Set the working directory to /app
WORKDIR /app

# Install curl and any other dependencies
RUN apt-get update \
    \
    && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json into the container at /app
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# Copy the current directory contents into the container
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
ENTRYPOINT [ "node", "main.js" ]
