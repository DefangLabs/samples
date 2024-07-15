# Use a base image with OpenJDK
FROM openjdk:17-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the compiled Java classes and resources to the container
COPY target/defang-javalin-1.0-SNAPSHOT.jar /app/app.jar

# Expose the port Javalin will run on
EXPOSE 7000

# Command to run the Javalin application
CMD ["java", "-jar", "/app/app.jar"]
