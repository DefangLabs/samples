# Use nginx as the base image
FROM nginx:stable

# Set working directory to /app
WORKDIR /app

# Copy project files to nginx directory
COPY . /usr/share/nginx/html

# Set correct permissions for the project files
RUN chmod -R 755 /usr/share/nginx/html && chown -R nginx:nginx /usr/share/nginx/html

# Copy the config file to nginx directory
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the port your app runs on
EXPOSE 8080

