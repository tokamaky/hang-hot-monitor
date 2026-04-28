# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder

# 复制 package 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖（包括 devDependencies 用于构建）
RUN npm ci

# 复制源码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 TypeScript
RUN npm run build

# 移除 devDependencies
RUN npm prune --production

# 生产镜像
FROM node:20-alpine AS production

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# 复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# 切换到非 root 用户
USER nodejs

# Railway 端口
ENV PORT=3001
EXPOSE 3001

# 启动命令：先同步 schema，再启动服务
# db push 用于 Railway 新部署（无 migration 历史）
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
