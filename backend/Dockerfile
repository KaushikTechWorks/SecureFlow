FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies including AWS Lambda requirements
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir aws-lambda-context boto3

# Copy application code
COPY . .

# Generate synthetic data on container start
RUN python data_generator.py

# Expose port
EXPOSE 5001

# Create Lambda-like environment variables
ENV AWS_LAMBDA_FUNCTION_NAME=secureflow-api \
    AWS_LAMBDA_FUNCTION_VERSION=$LATEST \
    AWS_REGION=us-east-1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# Start the application in Lambda-like environment
CMD ["python", "start_server.py"]
