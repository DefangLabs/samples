# DEVELOPMENT MODE
# Use slim version of Node.js v20 on Debian Bookworm as base image
FROM node:20-bookworm-slim as dev

# Set working directory to /app
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy rest of the applicationn code
COPY . .

# Expose port 5173
EXPOSE 5173

# Command to start the app
CMD ["npm", "run", "dev"]



# PRODUCTION MODE
# Build stage
FROM node:20-bookworm-slim as build

# Set working directory to /app
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 5173
EXPOSE 5173

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
