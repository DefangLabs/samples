# Dockerfile
FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install Sails globally
RUN npm install -g sails

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 1337

# Command to run the application
CMD ["sails", "lift"]
