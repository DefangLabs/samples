# Use the official Node.js image as the base image
FROM node:20-bookworm-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install --production

# Copy the rest of the application code to the working directory
COPY . .

# Expose the application port
EXPOSE 3042

# Define the command to run your application
CMD ["npm", "start"]
