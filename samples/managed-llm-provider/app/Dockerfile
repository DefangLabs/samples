FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirement files first (for better Docker cache)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

# Expose the port that Uvicorn will run on
EXPOSE 8000

# Set environment variable for the port
ENV PORT=8000

# Run the app with the correct module path using shell form to interpolate environment variable
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port $PORT --no-access-log"]
