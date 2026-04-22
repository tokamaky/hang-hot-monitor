import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载 .env 文件
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  dbPath: process.env.DB_PATH || './database/hotspots.db',

  // Email
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
  notificationEmail: process.env.NOTIFICATION_EMAIL,

  // APIs
  twitterApiKey: process.env.TWITTER_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,

  // Crawl Settings
  webCrawlerEnabled: process.env.WEB_CRAWLER_ENABLED !== 'false',
  twitterCrawlerEnabled: process.env.TWITTER_CRAWLER_ENABLED !== 'false',
  fetchIntervalMinutes: parseInt(process.env.FETCH_INTERVAL_MINUTES || '30'),
};

export default config;
