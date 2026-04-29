# 🔥 Hang Hot Monitor

> **A real-time, AI-augmented trend monitoring system for content creators, marketers, and researchers.**
> Set keywords once → parallel crawlers fan out across 8 platforms → an LLM filters out noise and ranks relevance → results stream to your browser via WebSocket and your inbox via SMTP.

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
  <img src="https://img.shields.io/badge/LLM-Powered-412991?logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white" />
</p>

---

## 🌐 Live Demo

👉 **[Try it on Railway](https://hang-hot-monitor.up.railway.app)** *(replace with your actual URL)*

> Add a keyword like `Claude Sonnet 4.7` or `OpenAI GPT-5` and watch hotspots stream in across the dashboard in real time. The page updates without a refresh — that's WebSocket + Prisma working in concert.

---

## 📌 The Problem

If you're a tech blogger, researcher, or product manager, **you can't afford to miss a trending topic**. The traditional workflow is awful:

- 🔄 Manually refresh Twitter/X, news sites, dev forums…
- 🗑️ Wade through marketing fluff and AI-generated spam
- ⏰ Lose hours that should have gone into actually writing

**Hang Hot Monitor** automates the entire pipeline. You give it keywords; it gives you a curated, AI-ranked feed.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                React 19 + Vite + Tailwind CSS 4                 │
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
│  │  │   2. parallel fetch from 8 sources                 │  │   │
│  │  │   3. preMatchKeyword() ← cheap text filter         │  │   │
│  │  │   4. analyzeContent()  ← LLM relevance + spam      │  │   │
│  │  │   5. dedupe + freshness filter                     │  │   │
│  │  │   6. persist + emit('hotspot:new') + email         │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Prisma ORM ──► SQLite (Postgres-ready via schema swap)         │
└─────────────────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐    ┌────────────────┐   ┌────────────────┐
│ LLM Gateway │    │ 8 data sources │   │ SMTP / Gmail   │
│  (provider- │    │ Twitter · HN · │   │ (Nodemailer)   │
│  agnostic)  │    │ Bing · Google… │   │                │
└─────────────┘    └────────────────┘   └────────────────┘
```

---

## 🛠️ Tech Stack

A deliberate, opinionated stack — every choice solves a specific problem.

### 🖥️ Frontend
| Tech | Version | Why it was chosen |
|---|---|---|
| **React** | 19 | Latest stable — concurrent rendering, automatic batching, server components ready |
| **TypeScript** | 5.9 | End-to-end type safety, especially for the typed Socket.io contract |
| **Vite** | 7 | Sub-second hot module reload — significantly faster than CRA / Webpack |
| **Tailwind CSS** | 4 | New `@tailwindcss/vite` engine — zero-runtime CSS-in-JS performance |
| **Framer Motion** | 12 | Production-grade spring physics for UI animations |
| **Socket.io-client** | 4.8 | Auto-reconnect, room-based subscriptions, transport fallback |
| **Lucide React** | — | Tree-shakeable icon library — only ships icons you actually use |

### ⚙️ Backend Core
| Tech | Version | Why it was chosen |
|---|---|---|
| **Node.js** | 20 LTS | Modern runtime with native `fetch`, top-level await, and stable ESM |
| **Express** | 5 | Industry-standard HTTP framework — minimal, predictable, massive ecosystem |
| **TypeScript** | 5.9 | Strict typing across the entire backend — shared types with the frontend |
| **Socket.io** | 4.8 | Battle-tested WebSocket abstraction with rooms, namespaces, and graceful fallback |
| **Prisma** | 6 | Type-safe ORM with auto-generated client, versioned migrations, and intuitive schema DSL |
| **node-cron** | — | Lightweight cron scheduler for the periodic crawl job |
| **tsx** | — | Zero-config TypeScript runner for dev — replaces `ts-node` with much faster startup |

### 🤖 AI / LLM Layer
| Concern | Solution | Why it was chosen |
|---|---|---|
| **LLM access** | Provider-agnostic LLM gateway | Decouples the app from any single LLM vendor — drop-in replacement for OpenAI, Anthropic, Mistral, etc. |
| **Cost optimization** | Two-stage pipeline (cheap text pre-filter → LLM only on survivors) | Reduces LLM calls by ~80% vs. naive "send everything to the model" approaches |
| **Caching** | In-memory `Map` for query expansion | Same keyword never gets expanded twice — eliminates redundant LLM calls |
| **Graceful degradation** | LLM is optional — works in search-only mode without an API key | App boots and runs even if the LLM provider is down |

> *Implementation note: the current build routes through OpenRouter (using DeepSeek as the default model), but the AI service layer is provider-agnostic — swapping to OpenAI's GPT-4o-mini or Anthropic's Claude Haiku is a one-line change.*

### 🌐 Data Sources & Crawling
| Concern | Solution | Why it was chosen |
|---|---|---|
| **Western platforms** | Twitter/X (twitterapi.io), Hacker News (Algolia API) | Official APIs with stable contracts and high rate limits |
| **Search engines** | Bing, Google, DuckDuckGo (HTML scraping with Cheerio) | Cover the long tail — anything not yet on Twitter/HN |
| **Chinese-language sources** | Weibo, Bilibili, Sogou (HTML scraping) | Critical for any topic where Chinese content moves earlier (especially AI / hardware) |
| **Rate limiting** | Custom per-source rate limiter | Prevents IP bans — different intervals per platform (Bing 5s, Google 10s, HN 1s) |
| **User-Agent rotation** | Pool of realistic UA strings | Avoids the obvious bot fingerprint |
| **HTTP client** | Axios + Cheerio | Industry-standard scraping stack with full browser-like header control |

### 💾 Data Layer
| Tech | Version | Why it was chosen |
|---|---|---|
| **Prisma** | 6 | Type-safe ORM with auto-generated client and versioned migrations |
| **SQLite** | — | Zero-config dev DB; one-line swap to **PostgreSQL** for production via `schema.prisma` |
| **Migrations** | Prisma Migrate | All schema changes are versioned in git — no `db push` cowboy ops |

### 📡 Real-time & Background Jobs
| Concern | Solution | Why it was chosen |
|---|---|---|
| **Real-time push** | Socket.io rooms (one room per keyword) | Clients only receive pushes for keywords they care about — pub/sub done right |
| **Scheduled jobs** | node-cron (every 30 min) | Lightweight, zero external dependencies — no Redis required for this scale |
| **Manual triggering** | `POST /api/check-hotspots` endpoint | Production cron + dev-time observability with the same code path |
| **Graceful shutdown** | `SIGINT` handler closes Prisma connection cleanly | Prevents zombie connections during deploys |

### 📧 Notifications
| Tech | Why it was chosen |
|---|---|
| **Nodemailer (SMTP)** | Provider-agnostic — works with Gmail, SendGrid, Mailgun, AWS SES |
| **HTML email digest** | Compiled at runtime — branded, mobile-responsive |
| **Per-keyword filtering** | Important + new only — never spams the inbox |

### 🌍 Internationalization
| Approach | Why it was chosen |
|---|---|
| **Custom React Context + lookup table** | Zero dependencies — proves you can solve simple problems without reaching for `i18next` |
| **English / Chinese support** | Both languages of the audience — instant switch, no page reload |

### 🐳 DevOps & Deployment
| Tech | Why it was chosen |
|---|---|
| **Vitest** | Fast, ESM-native test runner — Jest-compatible API but built on Vite |
| **Railway** | Cloud deployment with private networking, persistent volumes, and zero-config TLS |
| **Nixpacks build** | Auto-detects Node.js + builds without a Dockerfile |

---

## 🏆 Engineering Highlights

| # | Highlight | Why it matters |
|---|---|---|
| 1 | **Two-stage AI pipeline** — cheap text pre-filter → LLM only on survivors, with response caching | Demonstrates cost-aware system design — most engineers naively pipe everything through the LLM |
| 2 | **Provider-agnostic LLM layer** — abstracted behind a service interface | Vendor lock-in protection — production-grade architectural thinking |
| 3 | **Custom rate limiters per data source** with rotating User-Agents | Real-world scraping experience — not a textbook `axios.get()` |
| 4 | **Socket.io rooms** scoped per keyword | Fan-out broadcast vs. fan-in subscription — pub/sub done right |
| 5 | **Strict TypeScript end-to-end** with shared types between server and client | Catches contract drift at compile time |
| 6 | **Prisma migrations** versioned in git | Production-grade schema management, not `db push` cowboy ops |
| 7 | **Cron + manual trigger endpoint** for the same job | Production scheduling + dev-time observability |
| 8 | **Graceful degradation** — every external dependency (LLM, Twitter, SMTP) is optional | The app boots and works even without API keys |
| 9 | **Custom heat-score algorithm** with log compression | Comparing apples-to-oranges metrics across 8 platforms requires real math |
| 10 | **Modern UI polish** — Glassmorphism, Framer Motion springs, Tailwind v4 | Frontend craft, not just engineering |

---

## ✨ Feature Highlights

### 🌐 8 Data Sources, in Parallel
The crawler layer fans out across:

**Western platforms**
- **Twitter / X** (via twitterapi.io)
- **Hacker News** (Algolia API)
- **Bing**, **Google**, **DuckDuckGo** (HTML scraping with Cheerio)

**Chinese-language platforms**
- **Weibo** — microblogs
- **Bilibili** — videos + engagement metrics
- **Sogou** — search engine

Each source has its own **rate limiter** with custom intervals and **rotating User-Agent** headers to avoid detection.

### 🤖 Two-Stage AI Pipeline (cost-optimized)
Calling an LLM on every search result would be expensive. The pipeline does it in two stages:

1. **Query expansion** — once per keyword. Caches `"Claude Sonnet 4.7"` → `["Claude Sonnet", "Sonnet 4.7", "claude-sonnet-4.7", …]`
2. **Cheap pre-filter** — `preMatchKeyword()` drops obvious mismatches without an LLM call
3. **Deep analysis** — only survivors get scored for relevance, fact-vs-marketing classification, and importance level (`low`/`medium`/`high`/`urgent`)

The LLM layer is **provider-agnostic** — swapping between OpenAI, Anthropic, Mistral, or any OpenAI-compatible endpoint is a config change.

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
- **HTML email digest** — Nodemailer + SMTP (works with Gmail, SendGrid, Mailgun, AWS SES)
- **Per-keyword filtering** — important + new only, no spam

### 🌍 Full i18n (English / 中文)
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
│   │   │   ├── ai.ts                  # LLM: expand + filter + analyze
│   │   │   ├── twitter.ts             # Twitter/X client
│   │   │   ├── search.ts              # Bing, Google, DuckDuckGo, HN
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

# LLM (optional but recommended)
# Works with any OpenAI-compatible endpoint:
# OpenRouter, OpenAI, Anthropic (via proxy), Mistral, local Ollama, etc.
OPENROUTER_API_KEY=sk-or-v1-...

# Twitter/X (optional)
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
- [ ] OpenTelemetry tracing across the pipeline

---

## 📄 License

MIT

---

<p align="center">
  Built with ❤️ by Xiaohang Ji · <a href="https://xiaohang-ji-profile.netlify.app/">Contact</a>
</p>
