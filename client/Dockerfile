# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# VITE_API_URL 在构建时传入（Railway Build Variables）
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN ls -la /app/dist

# Production image
FROM nginx:alpine AS production

ENV PORT=5173

COPY --from=builder /app/dist /usr/share/nginx/html

# 复制到 docker-entrypoint.d 目录，nginx 会自动用 envsubst 替换变量
COPY nginx.conf.template /docker-entrypoint.d/default.conf.template

EXPOSE ${PORT}

CMD ["nginx", "-g", "daemon off;"]