import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { getKeywords } from '../models/keyword.js';
import { getHotspots, countHotspots } from '../models/hotspot.js';
import { getNotifications, countUnreadNotifications } from '../models/notification.js';
import { fetchHotspotsForAllKeywords } from '../services/crawlers/index.js';
import { sendHotspotNotification, sendDailySummaryEmail } from '../services/email-notifier.js';
import { config } from '../config/env.js';

let scheduledJobs = [];

/**
 * 热点获取定时任务
 */
export async function hotspotFetcherJob() {
  logger.info('⏰ Starting hotspot fetcher job...');

  try {
    const keywords = await getKeywords();
    
    if (keywords.length === 0) {
      logger.info('No keywords to monitor');
      return;
    }

    logger.info(`📝 Monitoring ${keywords.length} keywords`);

    // 获取所有关键词的热点
    const results = await fetchHotspotsForAllKeywords(keywords);

    // 统计结果
    let totalNewHotspots = 0;
    results.forEach((result) => {
      totalNewHotspots += result.newHotspots;

      // 这里可以添加邮件通知逻辑
      // 对于每个新热点，发送通知邮件
      result.results.forEach((hotspot) => {
        // 稍后集成到通知系统
      });
    });

    logger.success(`✅ Hotspot fetcher job completed. New hotspots: ${totalNewHotspots}`);
  } catch (error) {
    logger.error('Hotspot fetcher job error:', error.message);
  }
}

/**
 * 每日摘要邮件任务
 */
export async function dailySummaryJob() {
  logger.info('📧 Starting daily summary job...');

  try {
    const totalHotspots = await countHotspots();
    const keywords = await getKeywords();
    
    // 获取最近的热点
    const recentHotspots = await getHotspots(10, 0);

    if (recentHotspots.length > 0) {
      const stats = {
        newHotspots: recentHotspots.length,
        totalHotspots: totalHotspots,
        keywordsMonitoring: keywords.length,
      };

      await sendDailySummaryEmail(recentHotspots, stats);
    }

    logger.success('✅ Daily summary job completed');
  } catch (error) {
    logger.error('Daily summary job error:', error.message);
  }
}

/**
 * 启动任务调度器
 */
export function startScheduler() {
  logger.info('🚀 Starting task scheduler...');

  try {
    // 每 30 分钟执行一次热点获取
    const fetchInterval = config.fetchIntervalMinutes || 30;
    const fetchCron = `*/${fetchInterval} * * * *`;
    
    const hotspotFetchJob = cron.schedule(fetchCron, hotspotFetcherJob, {
      runOnInit: false,
    });
    scheduledJobs.push(hotspotFetchJob);

    logger.success(
      `✅ Hotspot fetcher scheduled every ${fetchInterval} minutes`
    );

    // 每天 9:00 发送摘要
    const summaryJob = cron.schedule('0 9 * * *', dailySummaryJob, {
      runOnInit: false,
    });
    scheduledJobs.push(summaryJob);

    logger.success('✅ Daily summary scheduled at 09:00');

    // 立即执行一次热点获取
    logger.info('Running initial hotspot fetch...');
    hotspotFetcherJob();
  } catch (error) {
    logger.error('Error starting scheduler:', error.message);
  }
}

/**
 * 停止任务调度器
 */
export function stopScheduler() {
  logger.info('⛔ Stopping task scheduler...');

  scheduledJobs.forEach((job) => {
    job.stop();
  });

  scheduledJobs = [];
  logger.success('✅ Scheduler stopped');
}

export default {
  hotspotFetcherJob,
  dailySummaryJob,
  startScheduler,
  stopScheduler,
};
