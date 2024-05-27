# Use the official Node.js 14 image as the base image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 1337
EXPOSE 1337

# Start the application
CMD ["node", "app.js"]
