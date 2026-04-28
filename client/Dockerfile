# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_API_URL 必须在构建时传入
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build (VITE_API_URL is embedded at build time)
RUN npm run build

# Verify build output
RUN ls -la /app/dist

# Production image - nginx to serve static files
FROM nginx:alpine AS production

ENV PORT=5173

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config (without hardcoded backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]