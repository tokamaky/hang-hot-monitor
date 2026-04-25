# 🔥 Hang Hot Monitor

> **A real-time, AI-augmented hotspot monitoring system for content creators.**
> Set keywords once → multi-source crawlers fan out across Twitter, Weibo, Bilibili, Hacker News, Bing, Sogou, DuckDuckGo, and Google → an LLM filters out spam and ranks relevance → results stream to your browser via WebSocket and your inbox via SMTP.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-4.8-010101?logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer&logoColor=white" />
  <img src="https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white" />
</p>

---

## 🌐 Live Demo

👉 **[Try it on Railway](https://hang-hot-monitor.up.railway.app)** *(replace with your actual URL)*

> Add a keyword like `Claude Sonnet 4.7` or `OpenAI` and watch hotspots stream in across the bottom of the page in real time. The dashboard updates without a page refresh — that's WebSocket + Prisma working in concert.

---

## 📌 The Problem

If you're a tech blogger, researcher, or PM, **you can't afford to miss a trending topic**. The traditional workflow is awful:

- 🔄 Manually refresh Twitter, Weibo, Bilibili, HN…
- 🗑️ Wade through marketing fluff and AI-generated spam
- ⏰ Lose hours that should have gone into actually writing

**Hang Hot Monitor** automates the whole pipeline. You give it keywords; it gives you a curated, ranked feed.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  React 19 + Vite + Tailwind 4                   │
│              (Glassmorphism UI · Framer Motion)                 │
│                                                                 │
│  Dashboard │ Keyword mgmt │ Hotspot list │ Notifications │ i18n │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │  REST API        WebSocket  │
        │  (HTTP/JSON)     (Socket.io)│
        ▼                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            Node.js · Express 5 · TypeScript                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes: /keywords  /hotspots  /notifications /settings  │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │       node-cron · runs every 30 minutes            │  │   │
│  │  │ ────────────────────────────────────────────────── │  │   │
│  │  │   1. expandKeyword()  ← LLM query expansion        │  │   │
│  │  │   2. parallel fetch:                               │  │   │
│  │  │      Twitter · Weibo · Bilibili · HN ·             │  │   │
│  │  │      Bing · Sogou · Google · DuckDuckGo            │  │   │
│  │  │   3. preMatchKeyword() ← cheap text filter         │  │   │
│  │  │   4. analyzeContent()  ← LLM relevance + spam      │  │   │
│  │  │   5. dedupe + freshness filter                     │  │   │
│  │  │   6. persist + emit('hotspot:new') + email         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Prisma ORM ──► SQLite (Railway volume)                         │
└─────────────────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐    ┌────────────────┐   ┌────────────────┐
│ OpenRouter  │    │ Twitter/Weibo/ │   │ SMTP / Gmail   │
│ (DeepSeek)  │    │ Bilibili/HN…   │   │ (Nodemailer)   │
└─────────────┘    └────────────────┘   └────────────────┘
```

---
## 🔥 Engineering Highlights

| # | Highlight | Why it matters |
|---|---|---|
| 1 | **Two-stage AI pipeline** (cheap text pre-filter → LLM only on survivors, with response caching) | Demonstrates cost-aware system design — most engineers naively pipe everything through the LLM |
| 2 | **Custom rate limiters per data source**, with rotating User-Agents | Real-world scraping experience — not a textbook `axios.get()` |
| 3 | **Socket.io rooms** scoped per keyword | Fan-out broadcast vs. fan-in subscription — pub/sub done right |
| 4 | **Strict TypeScript end-to-end** with shared types between server and client | Catch contract drift at compile time |
| 5 | **Prisma migrations** versioned in git | Production-grade schema management, not `db push` cowboy ops |
| 6 | **Cron + manual trigger endpoint** for the same job | Production scheduling + dev-time observability |
| 7 | **Graceful degradation** — every external dependency (Twitter, OpenRouter, SMTP) is optional | The app boots and works even without API keys |
| 8 | **Custom heat-score algorithm** with log compression | Comparing apples-to-oranges metrics across 8 different platforms |
| 9 | **i18n via React Context** — zero dependencies | Shows you can solve simple problems without reaching for `i18next` |
| 10 | **Glassmorphism UI** with Framer Motion + Tailwind v4 | Frontend polish, not just engineering |
---

## ✨ Feature Highlights

### 🌐 8 Data Sources, in Parallel
The crawler layer fans out across:
- **Twitter / X** (via twitterapi.io)
- **Weibo** — China's largest microblog
- **Bilibili** — videos + danmaku (弹幕) counts
- **Hacker News** (Algolia API)
- **Bing**, **Sogou**, **Google**, **DuckDuckGo** (HTML scraping with Cheerio)

Each source has its own **rate limiter** with custom intervals (Bing 5 s, Google 10 s, HN 1 s) and **rotating User-Agent** headers to avoid being blocked.

### 🤖 Two-Stage AI Pipeline (cost-optimized)
Calling an LLM on every search result would be expensive. The pipeline does it in two stages:

1. **Query expansion** — once per keyword. Caches `"Claude Sonnet 4.6"` → `["Claude Sonnet", "Sonnet 4.6", "claude-sonnet-4.6", …]`
2. **Cheap pre-filter** — `preMatchKeyword()` drops obvious mismatches without an LLM call
3. **Deep analysis** — only survivors get scored for relevance, fact-vs-marketing classification, and importance level (`low`/`medium`/`high`/`urgent`)

Backed by **OpenRouter** with `deepseek/deepseek-v3.2` — graceful degradation if the API key isn't configured.

### 🔌 Real-time WebSocket Push
Brand-new hotspots **stream into the UI without reload**:

```ts
// Backend (jobs/hotspotChecker.ts)
io.to(`keyword:${kw.text}`).emit('hotspot:new', hotspot);

// Frontend (services/socket.ts)
onNewHotspot((h) => setHotspots(prev => [h, ...prev]));
```

Clients subscribe per-keyword via Socket.io rooms — you only get pushes for what you care about.

### ⏰ Cron-driven Background Jobs
- Every **30 minutes** → full hotspot sweep across all active keywords
- Manual trigger endpoint `POST /api/check-hotspots` for testing
- Graceful shutdown on `SIGINT` (closes Prisma connection cleanly)

### 📧 Multi-channel Notifications
- **In-app toast** — Framer Motion-animated notification center with unread badge
- **HTML email digest** — Nodemailer + SMTP (Gmail app-password compatible)
- **Per-keyword filtering** — important + new only, no spam

### 🌍 Full i18n (中文 / English)
A custom React Context + `translations.ts` lookup — **no third-party i18n lib needed**. Switch languages instantly without page reload.

### 🎨 Modern Glassmorphism UI
- **Framer Motion** for spring physics on every card
- **Tailwind CSS v4** (the new `@tailwindcss/vite` engine)
- **Aceternity-style components**: `Spotlight`, `BackgroundBeams`, `Meteors`
- Smart sorting: by **heat score** (composite of likes/retweets/replies/views), recency, or importance
- Filters by source, importance, time range, real-vs-marketing

### 📊 Heat Score Algorithm
A weighted, log-compressed score that compares hotspots fairly across sources of different scales:

```ts
raw = likes·2 + retweets·3 + replies·1.5 + comments·1.5 + quotes·2 + views/100
score = min(100, round(log10(raw + 1) · 25))
```
---


## 🛠️ Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | React 19, Vite 7, TypeScript 5.9, Tailwind CSS 4, Framer Motion 12, Socket.io-client, Lucide icons |
| **Backend** | Node.js 20, Express 5, TypeScript, Socket.io 4.8, node-cron, Prisma 6 |
| **Database** | SQLite (managed by Prisma — easy Postgres swap via `schema.prisma`) |
| **AI** | OpenRouter SDK · DeepSeek v3.2 (configurable) |
| **Crawling** | Axios + Cheerio, custom rate limiters, UA rotation |
| **Email** | Nodemailer (SMTP) |
| **Build** | `tsx` for dev, `tsc` for prod, `vitest` for tests |
| **Deploy** | Railway (single container, Nixpacks build) |

---

## 📁 Project Structure

```
hang-hot-monitor/
│
├── server/                            # 🛠️  Backend
│   ├── prisma/
│   │   ├── schema.prisma              # 4 models: Keyword, Hotspot, Notification, Setting
│   │   └── migrations/                # Versioned schema changes
│   ├── src/
│   │   ├── index.ts                   # Express + Socket.io + cron bootstrap
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── types.ts                   # Shared SearchResult / AIAnalysis types
│   │   ├── routes/                    # ⭐ REST handlers
│   │   │   ├── keywords.ts
│   │   │   ├── hotspots.ts            # Pagination + filtering + sorting
│   │   │   ├── notifications.ts
│   │   │   └── settings.ts
│   │   ├── services/                  # ⭐ Business logic
│   │   │   ├── ai.ts                  # OpenRouter: expand + filter + analyze
│   │   │   ├── twitter.ts             # twitterapi.io client
│   │   │   ├── search.ts              # Bing, Google, DuckDuckGo, HN scrapers
│   │   │   ├── chinaSearch.ts         # Weibo, Bilibili, Sogou
│   │   │   └── email.ts               # SMTP digest
│   │   ├── jobs/
│   │   │   └── hotspotChecker.ts      # ⭐ The orchestration brain (cron job)
│   │   └── utils/
│   │       └── sortHotspots.ts
│   └── package.json
│
└── client/                            # 🖥️  Frontend
    ├── src/
    │   ├── App.tsx                    # Single-page dashboard
    │   ├── components/
    │   │   ├── FilterSortBar.tsx
    │   │   └── ui/                    # Spotlight, BackgroundBeams, Meteors
    │   ├── services/
    │   │   ├── api.ts                 # Typed REST client (no axios — native fetch)
    │   │   └── socket.ts              # Typed Socket.io wrapper
    │   ├── i18n/                      # 🌍 EN/ZH context-based i18n
    │   ├── utils/
    │   │   ├── relativeTime.ts        # "3 minutes ago" formatter
    │   │   └── sortHotspots.ts
    │   └── lib/utils.ts
    └── vite.config.ts
```

---

## 🗄️ Data Model (Prisma)

```prisma
model Keyword {
  id        String    @id @default(uuid())
  text      String    @unique
  category  String?
  isActive  Boolean   @default(true)
  hotspots  Hotspot[]
}

model Hotspot {
  id              String    @id @default(uuid())
  title           String
  content         String
  url             String
  source          String                    // twitter, weibo, bilibili, bing, hn…
  isReal          Boolean   @default(true)  // ← AI fact-vs-marketing flag
  relevance       Int       @default(0)     // ← AI relevance 0-100
  relevanceReason String?
  importance      String    @default("low") // low | medium | high | urgent
  summary         String?                   // AI-generated TL;DR

  // engagement metrics (nullable per-source)
  viewCount       Int?
  likeCount       Int?
  retweetCount    Int?
  replyCount      Int?
  commentCount    Int?
  quoteCount      Int?
  danmakuCount    Int?      // Bilibili-specific

  // author metadata
  authorName      String?
  authorUsername  String?
  authorAvatar    String?
  authorFollowers Int?
  authorVerified  Boolean?

  publishedAt     DateTime?
  keywordId       String?
  keyword         Keyword?  @relation(fields: [keywordId], references: [id], onDelete: SetNull)

  @@unique([url, source])  // ← cross-source dedupe
}
```

---

## 🚀 Quick Start

### 1. Backend

```bash
cd server
npm install

# Configure .env (see below)
cp .env.example .env

# Initialize the database
npx prisma migrate dev
npx prisma generate

# Start in dev mode (hot reload via tsx watch)
npm run dev
```

The server listens on `http://localhost:3001`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

### 3. Environment variables (`server/.env`)

```bash
# Server
PORT=3001
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL="file:./dev.db"

# AI (optional but recommended)
OPENROUTER_API_KEY=sk-or-v1-...

# Twitter (optional)
TWITTER_API_KEY=...

# SMTP (optional — for email digests)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-app-password
NOTIFICATION_EMAIL=you@gmail.com
```

> All third-party services are **optional** — the app degrades gracefully if a key is missing (search-only mode, no AI, no email).

---

## 🔌 API Reference

### Keywords
```
GET    /api/keywords                  List all keywords
POST   /api/keywords                  Create   { text, category? }
PUT    /api/keywords/:id              Update
DELETE /api/keywords/:id              Delete
PATCH  /api/keywords/:id/toggle       Activate / deactivate
```

### Hotspots
```
GET    /api/hotspots                  Paginated + filtered list
                                      ?page=1&limit=20
                                      &source=twitter
                                      &importance=urgent
                                      &timeRange=1h|today|7d
                                      &sortBy=createdAt&sortOrder=desc
GET    /api/hotspots/stats            { total, today, urgent, bySource }
POST   /api/hotspots/search           Full-text search across sources
DELETE /api/hotspots/:id              Delete a single hotspot
```

### Notifications
```
GET    /api/notifications             List (with unreadCount)
PATCH  /api/notifications/:id/read    Mark as read
PATCH  /api/notifications/read-all    Mark all as read
DELETE /api/notifications             Clear all
```

### Misc
```
GET    /api/health                    Liveness check
POST   /api/check-hotspots            Manually trigger a sweep
```

### WebSocket events
```
connection            Client connects
subscribe(keywords)   Join one or more "keyword:<text>" rooms
hotspot:new           Server pushes a new hotspot
notification          Server pushes a new notification
```



---

## 🛣️ Roadmap

- [ ] PostgreSQL adapter (one-line Prisma swap)
- [ ] Multi-user auth (currently single-tenant)
- [ ] Redis-backed rate limiter for horizontal scaling
- [ ] Reddit / Mastodon / Threads sources
- [ ] Trend chart over time (Recharts)
- [ ] Export digest as Markdown / PDF
- [ ] Docker compose for one-command local infra

---

## 📄 License

MIT

---

<p align="center">
  Built with ❤️ — <a href="mailto:your-email@example.com">Get in touch</a>
</p>
