# Use the official Node.js image
FROM node:18

# Create and change to the app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Copy app source code
COPY . .

# Expose the port the app runs on
EXPOSE 1337

# Start the app
CMD ["npm", "start"]
