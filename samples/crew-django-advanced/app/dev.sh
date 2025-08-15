#!/bin/sh

# Wait for the database to be ready using psycopg 3 and dj-database-url
until python3 -c '
import os, sys
import psycopg
import dj_database_url

url = os.environ.get("DATABASE_URL")
if not url:
    sys.exit("DATABASE_URL not set")

try:
    cfg = dj_database_url.parse(url)
    with psycopg.connect(
        dbname=cfg["NAME"],
        user=cfg["USER"],
        password=cfg["PASSWORD"],
        host=cfg["HOST"],
        port=cfg["PORT"] or 5432,
    ) as conn:
        pass  # Successful connection
except psycopg.OperationalError:
    sys.exit(1)
'
do
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
