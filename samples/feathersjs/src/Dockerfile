# Use the slim version of Node.js on Debian Bookworm as the base image
FROM node:bookworm-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json if available
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . ./

# Expose port 3030
EXPOSE 3030

# Define the command to run the application
CMD ["node", "index.js"]
