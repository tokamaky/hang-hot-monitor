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

ENV PORT=80

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf

RUN sed -i 's/\${VITE_API_URL}/'"${VITE_API_URL}"'/g' /etc/nginx/conf.d/default.conf && \
    sed -i 's/\${PORT}/'"${PORT:-80}"'/g' /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
