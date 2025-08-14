# ------------ FRONTEND BUILD STAGE ------------ #
FROM node:22-alpine AS frontend-build

WORKDIR /frontend

# Copy only package files first (cache optimization)
COPY frontend/package*.json ./
RUN npm ci

# Copy rest of the frontend source
COPY frontend/ ./
RUN npm run build


# ------------ BACKEND STAGE ------------ #
FROM python:3.13-slim AS backend

WORKDIR /app

# Install build dependencies for Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built frontend into backend's static folder
COPY --from=frontend-build /frontend/dist ./static

# Optionally expose the same port for both backend and frontend
EXPOSE 3000

# Start the backend server (which serves both API + frontend files)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
