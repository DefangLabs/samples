# Use the slim version of Node.js on Debian Bookworm as the base image
FROM node:20-bookworm-slim

RUN apt-get update -qq \
      && apt-get install -y curl \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Run the app when the container launches
ENTRYPOINT ["node", "main.js"]
