# 前端项目文档

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用

### 3. 构建生产版本

```bash
npm run build
```

输出文件在 `dist/` 目录

## 项目结构

```
frontend/
├── src/
│   ├── pages/              # 页面组件
│   │   ├── Dashboard.jsx   # 仪表板
│   │   ├── Keywords.jsx    # 关键词管理
│   │   ├── Hotspots.jsx    # 热点列表
│   │   └── Settings.jsx    # 设置
│   ├── components/         # 可复用组件
│   │   ├── Header.jsx      # 头部导航
│   │   ├── Sidebar.jsx     # 侧边栏
│   │   ├── HotspotCard.jsx # 热点卡片
│   │   └── NotificationCenter.jsx  # 通知中心
│   ├── hooks/              # 自定义 Hooks
│   │   ├── useKeywords.js
│   │   ├── useHotspots.js
│   │   └── useNotifications.js
│   ├── utils/              # 工具函数
│   │   ├── api.js          # API 客户端
│   │   └── date-utils.js   # 日期工具
│   ├── App.jsx             # 根组件
│   ├── index.jsx           # 入口
│   └── index.css           # 全局样式
├── index.html              # HTML 模板
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
└── package.json
```

## 核心技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI 框架 |
| Vite | 5.0.0 | 构建工具 |
| Tailwind CSS | 3.3.0 | 样式框架 |
| Axios | 1.6.2 | HTTP 客户端 |
| Lucide React | 0.294.0 | 图标库 |

## 页面功能详解

### 1. 仪表板 (Dashboard)

**显示内容**：
- 欢迎语
- 系统统计卡片（总热点数、未读通知、监控词数）
- 最新热点预览
- 快速统计信息

**主要功能**：
- 实时统计数据
- 快速浏览最新热点
- 导航到其他页面

### 2. 关键词管理 (Keywords)

**显示内容**：
- 添加关键词输入框
- 关键词列表（网格布局）
- 每个关键词显示创建时间

**主要功能**：
- ➕ 添加新关键词
- 🗑️ 删除关键词（确认后执行）
- 错误提示（如关键词重复）
- 列表实时更新

### 3. 热点监控 (Hotspots)

**显示内容**：
- 搜索框（查询热点内容）
- 数据源统计（Web / Twitter）
- 热点卡片网格

**主要功能**：
- 🔍 搜索热点内容
- 按数据源分类统计
- 分页加载（如支持）
- 热点详情展示

**热点卡片信息**：
- 标题
- 数据源标签（Web/Twitter）
- 热度评分
- 内容预览
- 发布时间
- 原文链接

### 4. 设置 (Settings)

**配置项**：
- 通知设置（网页、邮件、摘要）
- 数据来源开关
- 邮件配置查看
- 系统信息

## 自定义 Hooks

### useKeywords()

```javascript
const { keywords, loading, error, fetchKeywords, addKeyword, deleteKeyword } = useKeywords();
```

**属性**：
- `keywords`: 关键词数组
- `loading`: 加载状态
- `error`: 错误信息
- `fetchKeywords()`: 刷新关键词列表
- `addKeyword(keyword)`: 添加关键词
- `deleteKeyword(id)`: 删除关键词

### useHotspots()

```javascript
const { hotspots, loading, error, pagination, fetchHotspots, searchHotspots } = useHotspots();
```

**属性**：
- `hotspots`: 热点数组
- `loading`: 加载状态
- `error`: 错误信息
- `pagination`: 分页信息
- `fetchHotspots(limit, offset)`: 获取热点列表
- `searchHotspots(keyword)`: 搜索热点

### useNotifications()

```javascript
const { notifications, unreadCount, loading, error, fetchNotifications, markAsRead } = useNotifications();
```

**属性**：
- `notifications`: 通知数组
- `unreadCount`: 未读数
- `loading`: 加载状态
- `error`: 错误信息
- `fetchNotifications(limit, offset)`: 获取通知
- `markAsRead(id)`: 标记已读

## API 调用 (api.js)

```javascript
// 关键词 API
keywordAPI.getAll()          // GET /api/keywords
keywordAPI.add(keyword)      // POST /api/keywords
keywordAPI.delete(id)        // DELETE /api/keywords/:id

// 热点 API
hotspotsAPI.getAll(...)      // GET /api/hotspots
hotspotsAPI.search(keyword)  // GET /api/hotspots/search

// 通知 API
notificationsAPI.getAll(...) // GET /api/notifications
notificationsAPI.markAsRead(id) // PUT /api/notifications/:id

// 统计 API
statsAPI.getStats()          // GET /api/stats

// 健康检查
healthAPI.check()            // GET /api/health
```

## 样式系统

### Tailwind 配置

```javascript
colors: {
  primary: '#FF6B6B',      // 红色
  secondary: '#4ECDC4',    // 青色
  dark: '#1A1A2E',         // 深色
  light: '#F7F7F7',        // 浅色
}
```

### 自定义类

| 类名 | 用途 |
|------|------|
| `.glass` | 玻璃拟态样式 |
| `.badge` | 标签样式 |
| `.card-hover` | 卡片悬停效果 |
| `.gradient-text` | 渐变文本 |

### 动画

| 动画 | 说明 |
|------|------|
| `animate-slideIn` | 从上向下滑入 |
| `animate-fadeIn` | 淡入效果 |
| `animate-bounce-light` | 轻轻上下跳动 |

## 响应式设计

使用 Tailwind 的断点系统：

- `sm`: 640px 及以上（平板）
- `md`: 768px 及以上（小桌面）
- `lg`: 1024px 及以上（大桌面）

**示例**：
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## 用户交互流程

### 添加关键词

1. 用户在 Keywords 页面输入关键词
2. 点击"添加"按钮
3. 前端验证输入
4. 调用 `POST /api/keywords`
5. 后端存储关键词
6. 前端更新列表
7. 系统后台开始监控此关键词

### 接收热点通知

1. 系统后台每 30 分钟执行热点获取任务
2. 爬虫采集多源数据
3. AI 识别和过滤
4. 匹配用户关键词
5. 创建通知记录
6. 发送邮件（可选）
7. 用户在网页中看到红点和新通知

## 调试技巧

### 启用 React DevTools
```bash
# 浏览器安装 React Developer Tools 扩展
```

### 查看 API 请求
```bash
# 浏览器 F12 → Network 标签
# 可以看到所有 API 请求和响应
```

### 模拟离线状态
```bash
# 浏览器 F12 → Network 标签 → 选择"Offline"
# 测试离线体验
```

## 优化建议

### 性能优化
- 使用 React.memo 避免不必要的重渲染
- 使用 useCallback 缓存回调函数
- 图片懒加载（如有）
- 代码分割（路由级别）

### SEO 优化
- 完善 meta 标签
- Open Graph 标签
- 结构化数据

### 无障碍性 (A11y)
- 补充 ARIA 标签
- 键盘导航支持
- 颜色对比度优化

## 常见问题

**Q: 如何修改 API 地址？**
A: 修改 `src/utils/api.js` 中的 `API_BASE_URL`

**Q: 如何修改样式配色？**
A: 修改 `tailwind.config.js` 中的 `colors` 配置

**Q: 如何添加新页面？**
A: 
1. 在 `src/pages/` 创建新文件
2. 在 `App.jsx` 的 `pages` 对象中添加
3. 在 `Sidebar.jsx` 中添加导航项

**Q: 如何处理网络请求错误？**
A: 各个 Hook 都有 `error` 状态，可以在组件中处理

**Q: 如何自定义通知样式？**
A: 编辑 `src/components/NotificationCenter.jsx`

## 部署

### 构建静态文件
```bash
npm run build
```

### 部署到静态服务
```bash
# 将 dist/ 目录上传到服务器
# 配置服务器指向 index.html（SPA 路由）
```

### Nginx 配置示例
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 开发规范

### 命名规范
- 组件：PascalCase (Dashboard.jsx)
- 函数：camelCase (fetchData)
- 常量：UPPER_CASE (API_URL)

### 代码风格
- 使用 Prettier 格式化代码
- 使用 ESLint 检查代码质量
- 组件保持在 300 行以内

### Git 提交信息
```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 代码重构
perf: 性能优化
test: 测试相关
```

---

更多信息请查看 [主项目文档](../README.md)
