# Use official lightweight Python image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and data assets
COPY . .

# Expose backend API port
EXPOSE 8001

# Command to boot Uvicorn server dynamically reading allocated system ports
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}
