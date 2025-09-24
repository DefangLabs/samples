FROM python:3.11-slim

WORKDIR /app

# Install Poetry
RUN pip install --no-cache-dir poetry

# Copy only poetry files first for caching
COPY pyproject.toml poetry.lock* /app/

# Install dependencies
RUN poetry install --no-root --no-interaction --no-ansi

# Copy the rest of the application
COPY . /app

CMD ["poetry", "run", "python", "main.py"]
