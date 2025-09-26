# Start from the official Node.js LTS image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build the Next.js app
ARG NEXT_OUTPUT
RUN npm run build

# If we're doing an export, copy all files from the out directory to /static
# This is a workaround for Next.JS issue https://github.com/vercel/next.js/issues/59988
RUN if [ "$NEXT_OUTPUT" = "export" ]; then \
    cp -R out/* /static/; \
    fi

# Expose the port that your app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]