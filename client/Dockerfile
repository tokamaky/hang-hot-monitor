# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 接收 Railway 构建参数
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源码
COPY . .

# 构建（VITE_API_URL 此时已嵌入 bundle）
RUN npm run build

# 生产镜像 - 使用 nginx 来服务静态文件
FROM nginx:alpine AS production

# 复制 nginx 配置
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
