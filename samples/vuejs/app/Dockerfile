# Use Node runtime as base image 
FROM node:20-alpine

# Set working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application's code
COPY . .

# Expose the port your app runs on
EXPOSE 5173

# Command to run the app when container is finished launch
CMD ["npm", "run", "dev"]