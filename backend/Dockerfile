FROM python:3.13-slim

# Install system dependencies for pdf2image
RUN apt-get update && apt-get install -y \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Copy and make run script executable
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

# Install PostgreSQL client for health checks
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Run the application using the startup script
CMD ["/app/run.sh"]

