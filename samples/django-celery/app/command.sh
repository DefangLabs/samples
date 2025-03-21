#!/bin/bash

# Apply database migrations
python manage.py migrate

# Create superuser if not exists
python manage.py createsuperauto

# Start the Django development server if DEBUG is True
if [ "$DEBUG" = "True" ]; then
    python manage.py runserver 0.0.0.0:8000
else
    gunicorn django_celery.wsgi:application --bind 0.0.0.0:8000 --workers 1 --threads 2 --timeout 120
fi
