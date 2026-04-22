# 后端项目文档

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件，配置必要的参数
```

### 3. 初始化数据库

```bash
npm run init-db
```

这将创建必要的数据库表。

### 4. 启动服务器

**开发模式**（推荐）：
```bash
npm run dev
```

**生产模式**：
```bash
npm start
```

服务器默认运行在 `http://localhost:3000`

## 环境变量详解

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | 服务器端口 | 3000 |
| `NODE_ENV` | 环境（development/production） | development |
| `DB_PATH` | SQLite 数据库路径 | ./database/hotspots.db |
| `SMTP_HOST` | SMTP 服务器地址 | smtp.gmail.com |
| `SMTP_PORT` | SMTP 端口 | 587 |
| `SMTP_USER` | SMTP 账户 | your-email@gmail.com |
| `SMTP_PASSWORD` | SMTP 密码或应用密码 | xxxx |
| `SMTP_FROM` | 邮件发件人 | your-email@gmail.com |
| `NOTIFICATION_EMAIL` | 通知接收邮箱 | recipient@example.com |
| `TWITTER_API_KEY` | Twitter API Key | xxxx |
| `OPENROUTER_API_KEY` | OpenRouter API Key | xxxx |
| `WEB_CRAWLER_ENABLED` | 启用网页爬虫 | true |
| `TWITTER_CRAWLER_ENABLED` | 启用 Twitter 爬虫 | true |
| `FETCH_INTERVAL_MINUTES` | 热点获取间隔（分钟） | 30 |

## 核心模块说明

### 配置模块 (`src/config/`)

- **database.js**: 数据库初始化和连接
- **env.js**: 环境变量加载和配置管理

### 服务模块 (`src/services/`)

#### 爬虫服务 (`crawlers/`)

**web-crawler.js**:
- `searchWeb(keyword)`: 执行网页搜索
- `scrapeUrl(url)`: 爬取单个 URL 内容
- 使用 DuckDuckGo 作为搜索源（无需 API Key）
- 内置频率控制和延迟机制

**twitter-crawler.js**:
- `searchTwitter(keyword)`: 搜索 Twitter 推文
- `getTwitterTrends()`: 获取热搜话题（需要 Premium）
- 使用 twitterapi.io API
- 支持多语言搜索

**index.js** (爬虫协调器):
- `fetchHotspotsForKeyword(keyword)`: 获取单个关键词的热点
- `fetchHotspotsForAllKeywords(keywords)`: 批量获取热点
- 并行执行多个爬虫
- 自动去重和存储

#### AI 识别服务 (`ai-detector.js`)

- `analyzeHotspotWithAI(hotspot, keyword)`: 分析单个热点
- `analyzeHotspotsWithAI(hotspots, keyword)`: 批量分析
- 使用 OpenRouter API（支持 GPT-3.5 等）
- 评分项目：
  - 真实性评分 (0-10)
  - 是否为垃圾内容
  - 与关键词的相关性

#### 邮件通知服务 (`email-notifier.js`)

- `sendHotspotNotification(keyword, hotspot)`: 发送单个热点通知
- `sendDailySummaryEmail(hotspots, stats)`: 发送每日摘要
- 使用 Nodemailer
- HTML 邮件模板

### 数据模型 (`src/models/`)

#### keyword.js
```javascript
addKeyword(keyword)        // 添加关键词
getKeywords()              // 获取所有关键词
getKeywordById(id)         // 按 ID 获取
deleteKeyword(id)          // 删除（标记为不活跃）
```

#### hotspot.js
```javascript
addHotspot(hotspotData)    // 添加热点
getHotspots(limit, offset) // 分页获取
getHotspotsByKeyword(...)  // 按关键词搜索
getHotspotByHash(hash)     // 按哈希值获取（去重检查）
countHotspots()            // 获取总数
```

#### notification.js
```javascript
addNotification(...)       // 创建通知
getNotifications(...)      // 获取未读通知
markAsRead(id)             // 标记为已读
markEmailSent(id)          // 标记邮件已发送
countUnreadNotifications() // 获取未读数
```

### 定时任务 (`src/jobs/scheduler.js`)

- `hotspotFetcherJob()`: 热点获取任务（每30分钟执行）
- `dailySummaryJob()`: 每日摘要任务（每天09:00执行）
- `startScheduler()`: 启动所有任务
- `stopScheduler()`: 停止所有任务

## API 路由详解

所有 API 返回格式：
```json
{
  "success": true/false,
  "data": {...},
  "error": "error message"
}
```

### 关键词相关

**GET /api/keywords**
- 获取所有活跃关键词
- 返回：关键词数组

**POST /api/keywords**
- 添加新关键词
- 请求体：`{ "keyword": "AI大模型" }`
- 返回：创建的关键词对象

**DELETE /api/keywords/:id**
- 删除关键词（逻辑删除）
- 返回：成功消息

### 热点相关

**GET /api/hotspots**
- 获取热点列表（分页）
- 查询参数：`limit` (默认50), `offset` (默认0)
- 返回：热点数组 + 分页信息

**GET /api/hotspots/search**
- 搜索热点内容
- 查询参数：`keyword` (必需)
- 返回：匹配的热点数组

### 通知相关

**GET /api/notifications**
- 获取未读通知列表
- 查询参数：`limit`, `offset`
- 返回：通知数组 + 未读数

**PUT /api/notifications/:id**
- 标记通知为已读
- 返回：成功消息

### 其他

**GET /api/stats**
- 获取系统统计数据
- 返回：统计对象

**GET /api/health**
- 健康检查
- 返回：服务器状态

## 日志系统

使用 `src/utils/logger.js` 进行日志记录：

```javascript
import { logger } from './utils/logger.js';

logger.info('信息', data);
logger.success('成功', data);
logger.warn('警告', data);
logger.error('错误', data);
logger.debug('调试', data); // 仅在开发模式显示
```

## 数据库架构

### keywords 表
```sql
id           INTEGER PRIMARY KEY
keyword      TEXT UNIQUE
created_at   DATETIME
is_active    BOOLEAN
```

### hotspots 表
```sql
id               INTEGER PRIMARY KEY
title            TEXT
source           TEXT (web/twitter/etc)
url              TEXT
content          TEXT
raw_data         JSON
hash             TEXT UNIQUE (去重用)
ai_score         REAL (0-10)
is_real          BOOLEAN (真实性判断)
relevance_score  REAL (0-10)
created_at       DATETIME
```

### notifications 表
```sql
id          INTEGER PRIMARY KEY
keyword_id  INTEGER (外键)
hotspot_id  INTEGER (外键)
status      TEXT (read/unread)
email_sent  BOOLEAN
created_at  DATETIME
```

## 错误处理

系统会自动处理以下场景：

1. **API 故障**：如果某个数据源无法访问，不会中断其他数据源
2. **重复数据**：基于内容哈希自动去重
3. **邮件发送失败**：记录错误但继续执行
4. **数据库错误**：返回 500 错误，记录日志

## 频率控制策略

1. **网页爬虫**：
   - 随机延迟 2-5 秒
   - 轮换 User-Agent

2. **Twitter API**：
   - 每次请求后延迟 2-5 秒
   - 遵守 API 限流规则

3. **AI 分析**：
   - 批量分析之间延迟 500ms
   - 避免 OpenRouter API 限流

## 调试技巧

### 启用详细日志
```bash
NODE_ENV=development npm run dev
```

### 手动触发热点获取
```bash
# 在 Node.js REPL 中
import { hotspotFetcherJob } from './src/jobs/scheduler.js';
await hotspotFetcherJob();
```

### 查看数据库
```bash
# 使用 SQLite CLI
sqlite3 ./database/hotspots.db
.tables
SELECT * FROM keywords;
```

## 常见问题

**Q: 如何更改热点获取频率？**
A: 修改 `.env` 中的 `FETCH_INTERVAL_MINUTES`

**Q: Twitter API 返回错误？**
A: 检查 API Key 是否有效，查看速率限制

**Q: 邮件无法发送？**
A: 检查 SMTP 配置，Google 需要应用专用密码

**Q: 数据库变得过大？**
A: 可以定期清理旧数据或使用数据库备份

## 部署建议

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 管理
```bash
npm install -g pm2
pm2 start src/server.js --name "hot-monitor"
pm2 save
pm2 startup
```

---

更多信息请查看 [主项目文档](../README.md)
