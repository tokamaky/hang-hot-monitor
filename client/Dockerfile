# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN ls -la /app/dist

# Production image
FROM nginx:alpine AS production

# Railway 会自动设置 $PORT，不硬编码！
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /docker-entrypoint.d/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]