# Stage 1: Build the application
FROM node:bookworm as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# List the contents of the build directory for verification
RUN ls -l .svelte-kit/output

# Stage 2: Run the application
FROM node:bookworm

WORKDIR /app

# Copy the built application and package files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package.json /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "build"]
