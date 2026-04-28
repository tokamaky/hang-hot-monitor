# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments with defaults
ARG VITE_API_URL=https://backend-production-2871.up.railway.app
ENV VITE_API_URL=${VITE_API_URL}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build (VITE_API_URL is embedded at this point)
RUN npm run build

# Verify dist folder exists and has content
RUN ls -la /app/dist && test -f /app/dist/index.html

# Production image - nginx to serve static files
FROM nginx:alpine AS production

# Copy built files and nginx config
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
