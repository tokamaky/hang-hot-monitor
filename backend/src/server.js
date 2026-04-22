import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { startScheduler } from './jobs/scheduler.js';
import apiRoutes from './api/routes.js';

const app = express();

// ==================== Middleware ====================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ==================== API Routes ====================

app.use('/api', apiRoutes);

// ==================== Error Handling ====================

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
});

// ==================== 404 Handler ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
  });
});

// ==================== Server Startup ====================

async function startServer() {
  try {
    // 初始化数据库
    logger.info('Initializing database...');
    await initDatabase();

    // 启动任务调度器
    logger.info('Starting scheduler...');
    startScheduler();

    // 启动服务器
    app.listen(config.port, () => {
      logger.success(`🚀 Server running at http://localhost:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Database: ${config.dbPath}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

export default app;
