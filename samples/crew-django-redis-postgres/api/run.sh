#!/bin/sh

# Wait for the database to be ready
until python manage.py migrate --check; do
  echo "Waiting for database to be ready..."
  sleep 2
  # Optionally, add a timeout or a check for container health
  # You can also use: python manage.py wait_for_db
  # Or: nc -z $DB_HOST $DB_PORT
  # But migrate --check is simple and robust for Django
  # If you want to be more explicit, use: python manage.py check --database default
  # Or: python manage.py wait_for_db (if you have a custom command)
done

# Run migrations
python manage.py migrate --noinput
python manage.py create_initial_superuser

# Start Daphne server
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
