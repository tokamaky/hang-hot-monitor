# 🔥 热点监控系统 (HotMonitor)

一个智能化的热点监控系统，帮助内容创作者（如AI编程博主）第一时间发现和追踪行业热点。

## ✨ 核心功能

- 🎯 **关键词监控**：用户输入关键词，系统自动监控相关内容
- 🌐 **多源数据采集**：
  - 网页搜索（网页爬虫）
  - Twitter(X) API（实时推文）
  - 可扩展其他数据源
- 🤖 **AI 智能识别**：
  - 利用 OpenRouter API 识别假新闻/营销内容
  - 评估热点真实性和相关度
  - 智能筛选垃圾内容
- 📧 **多渠道通知**：
  - 网页内实时通知
  - 邮件通知
  - 每日热点摘要
- 📊 **仪表板**：直观的数据可视化和统计分析
- 📱 **响应式设计**：完美适配桌面、平板、手机

## 🛠️ 技术栈

### 后端
- **Runtime**: Node.js
- **框架**: Express.js
- **数据库**: SQLite
- **任务调度**: node-cron
- **网页爬虫**: Cheerio
- **邮件服务**: Nodemailer
- **AI接入**: OpenRouter API

### 前端
- **框架**: React 18
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **HTTP客户端**: Axios
- **图标库**: Lucide React

## 📁 项目结构

```
hang-hot-monitor/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── config/
│   │   ├── api/routes.js
│   │   ├── services/
│   │   │   ├── crawlers/
│   │   │   ├── ai-detector.js
│   │   │   └── email-notifier.js
│   │   ├── models/
│   │   ├── jobs/scheduler.js
│   │   └── utils/
│   ├── database/
│   │   └── init.sql
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## 🚀 快速开始

### 1. 环境准备

**必需**:
- Node.js >= 16
- npm 或 yarn

**可选**（用于完整功能）:
- Twitter API Key (来自 twitterapi.io)
- OpenRouter API Key
- SMTP 邮箱配置

### 2. 后端启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 API Key 和邮箱配置

# 初始化数据库
npm run init-db

# 启动服务器
npm start
# 或开发模式（需要 nodemon）
npm run dev
```

服务器运行在 `http://localhost:3000`

### 3. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行在 `http://localhost:5173`

## 🔌 API 文档

### 关键词管理
```
GET    /api/keywords              获取所有关键词
POST   /api/keywords              添加新关键词
DELETE /api/keywords/:id          删除关键词
```

### 热点管理
```
GET    /api/hotspots              获取热点列表（分页）
GET    /api/hotspots/search       搜索热点
```

### 通知管理
```
GET    /api/notifications         获取通知列表
PUT    /api/notifications/:id     标记通知为已读
```

### 统计信息
```
GET    /api/stats                 获取系统统计数据
GET    /api/health                健康检查
```

## ⚙️ 环境变量配置

### 后端 `.env` 文件示例

```bash
# 服务器配置
PORT=3000
NODE_ENV=development
DB_PATH=./database/hotspots.db

# 邮件配置（用于通知）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
NOTIFICATION_EMAIL=recipient@example.com

# API Keys
TWITTER_API_KEY=your-twitter-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# 爬虫配置
WEB_CRAWLER_ENABLED=true
TWITTER_CRAWLER_ENABLED=true
FETCH_INTERVAL_MINUTES=30
```

### 获取 API Keys

**Twitter API**:
- 访问 https://twitterapi.io/
- 注册并获取 API Key

**OpenRouter API**:
- 访问 https://openrouter.ai/
- 注册并创建 API Key

## 📊 定时任务说明

系统会自动执行以下任务：

1. **热点获取任务**：每 30 分钟执行一次
   - 搜索所有监控关键词的最新内容
   - 从多个来源采集数据
   - 去重后存储到数据库
   - 触发邮件通知（如有新热点）

2. **每日摘要任务**：每天上午 9 点执行
   - 汇总最近的热点
   - 发送摘要邮件

## 🎨 UI/UX 特点

- 🌈 现代渐变设计（红-粉-紫）
- ✨ Glassmorphism 玻璃拟态风格
- 📱 完全响应式布局
- ⚡ 流畅的动画和过渡效果
- 🎯 直观的用户交互

## 🔄 工作流程

```
1. 用户添加关键词
   ↓
2. 系统每30分钟自动执行
   ↓
3. 多源爬虫并行采集数据
   ├─ 网页搜索
   ├─ Twitter API
   └─ 其他源（可扩展）
   ↓
4. 数据合并、去重、清洗
   ↓
5. AI 识别（OpenRouter）
   ├─ 真实性判断
   ├─ 垃圾内容过滤
   └─ 相关性评分
   ↓
6. 匹配用户关键词
   ↓
7. 发送通知
   ├─ 网页内实时通知
   └─ 邮件通知
```

## 🧪 测试步骤

### 1. 基础功能测试
```bash
# 添加关键词
curl -X POST http://localhost:3000/api/keywords \
  -H "Content-Type: application/json" \
  -d '{"keyword":"AI大模型"}'

# 获取关键词
curl http://localhost:3000/api/keywords

# 获取热点
curl http://localhost:3000/api/hotspots?limit=10

# 健康检查
curl http://localhost:3000/api/health
```

### 2. 网页测试
- 打开 http://localhost:5173
- 在仪表板查看统计信息
- 添加关键词并检查监控
- 查看热点列表
- 检查通知中心

## 📝 后续功能规划

- [ ] Agent Skills 封装（用于其他AI助手调用）
- [ ] 数据库迁移（支持 PostgreSQL、MongoDB）
- [ ] 更多数据源（HN、Reddit、知乎、微博）
- [ ] 高级过滤和排序
- [ ] 热点趋势分析图表
- [ ] 用户认证和多用户支持
- [ ] WebSocket 实时推送
- [ ] Docker 容器化部署
- [ ] CI/CD 流程

## 🤝 贡献指南

欢迎 Issue 和 PR！

## 📄 许可证

MIT

## 👨‍💻 作者

鱼皮工作室

---

**想要了解更多？** 查看 [后端文档](./backend/README.md) 和 [前端文档](./frontend/README.md)
