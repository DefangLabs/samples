FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=django_celery.settings

# Create a non-root user
RUN adduser --disabled-password --gecos "" django

# Install system dependencies (merged from both stages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    gunicorn \
    whitenoise \
    dj-database-url \
    psycopg2-binary \
    redis

# Copy project files
COPY --chown=django:django . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Switch to non-root user
USER django

# Expose port 8000
EXPOSE 8000

CMD [ "./command.sh" ]