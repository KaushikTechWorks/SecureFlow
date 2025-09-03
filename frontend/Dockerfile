FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Accept build argument for API URL - default to Fly.io backend URL
ARG REACT_APP_API_URL=https://secureflow-backend.fly.dev
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the application with cache busting enabled
RUN GENERATE_SOURCEMAP=false npm run build

# Production stage - Using nginx to simulate S3/CloudFront hosting
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Configure nginx to behave more like CloudFront/S3
RUN echo 'server_tokens off;' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-Content-Type-Options nosniff;' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-Frame-Options DENY;' >> /etc/nginx/conf.d/default.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block";' >> /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"]
