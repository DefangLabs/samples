#!/bin/sh

# Run migrations
python manage.py migrate --noinput
python manage.py create_initial_superuser

# Start Daphne server
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
