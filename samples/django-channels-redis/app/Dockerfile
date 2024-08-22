# Use an official Python runtime as a parent image
FROM python:3.10.4-slim-buster AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /code

# Install dependencies
COPY requirements.txt /code/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /code/

# Collect static files
RUN python manage.py collectstatic --noinput


# Use a smaller base image for the final stage
FROM python:3.10.4-slim-buster

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /code

# Copy the dependencies from the builder stage
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /code /code

# Create a non-root user
RUN adduser --disabled-password --gecos '' django

# Set the user to the non-root user
USER django

# Start server
CMD ["sh", "-c", "python manage.py migrate && gunicorn defang_sample.wsgi:application --bind 0.0.0.0:8000"]