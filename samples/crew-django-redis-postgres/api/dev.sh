#!/bin/sh

# Wait for the database to be ready
until python manage.py migrate --check; do
  echo "Waiting for database to be ready..."
  sleep 2
done

# Run migrations
python manage.py migrate --noinput
python manage.py create_initial_superuser

# Note: For Django Channels and ASGI support, you should use an ASGI server like Daphne or Uvicorn.
# The normal runserver is fine for basic development and will use ASGI if available,
# but it is not recommended for production or for full async support.

# Start Django development server (sufficient for simple local dev/testing)
exec python manage.py runserver 0.0.0.0:8000
