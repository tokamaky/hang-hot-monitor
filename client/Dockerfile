# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY eslint.config.js ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set default PORT if not provided (Railway uses 8080)
ENV PORT=${PORT:-8080}

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx with env substitution
CMD ["sh", "-c", "sed -e 's/__PORT__/'$PORT'/g' -e 's|__VITE_API_URL__|'$VITE_API_URL'|g' /etc/nginx/conf.d/nginx.conf > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
