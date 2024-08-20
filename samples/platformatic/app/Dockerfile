# Use the official Node.js Alpine image as a parent image
FROM node:alpine

# Install dependencies for building native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install node modules
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port that the app runs on
EXPOSE 3042

# Command to run the application
CMD ["npm", "start"]
