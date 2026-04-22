import express from 'express';
import * as keywordModel from '../models/keyword.js';
import * as hotspotModel from '../models/hotspot.js';
import * as notificationModel from '../models/notification.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// ==================== Keywords API ====================

/**
 * GET /api/keywords - 获取所有关键词
 */
router.get('/keywords', async (req, res) => {
  try {
    const keywords = await keywordModel.getKeywords();
    res.json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    logger.error('Error fetching keywords:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/keywords - 添加新关键词
 */
router.post('/keywords', async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required',
      });
    }

    const result = await keywordModel.addKeyword(keyword);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        error: 'Keyword already exists',
      });
    }
    logger.error('Error adding keyword:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/keywords/:id - 删除关键词
 */
router.delete('/keywords/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await keywordModel.deleteKeyword(id);
    res.json({
      success: true,
      message: 'Keyword deleted',
    });
  } catch (error) {
    logger.error('Error deleting keyword:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Hotspots API ====================

/**
 * GET /api/hotspots - 获取热点列表（分页）
 */
router.get('/hotspots', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50'), 100);
    const offset = parseInt(req.query.offset || '0');

    const hotspots = await hotspotModel.getHotspots(limit, offset);
    const total = await hotspotModel.countHotspots();

    res.json({
      success: true,
      data: hotspots,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    logger.error('Error fetching hotspots:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/hotspots/search - 搜索热点
 */
router.get('/hotspots/search', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required',
      });
    }

    const hotspots = await hotspotModel.getHotspotsByKeyword(keyword, 50);

    res.json({
      success: true,
      data: hotspots,
    });
  } catch (error) {
    logger.error('Error searching hotspots:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Notifications API ====================

/**
 * GET /api/notifications - 获取通知列表
 */
router.get('/notifications', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50'), 100);
    const offset = parseInt(req.query.offset || '0');

    const notifications = await notificationModel.getNotifications(limit, offset);
    const unreadCount = await notificationModel.countUnreadNotifications();

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/notifications/:id - 标记通知为已读
 */
router.put('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await notificationModel.markAsRead(id);
    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    logger.error('Error marking notification:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Stats API ====================

/**
 * GET /api/stats - 获取统计信息
 */
router.get('/stats', async (req, res) => {
  try {
    const totalHotspots = await hotspotModel.countHotspots();
    const unreadNotifications = await notificationModel.countUnreadNotifications();
    const keywords = await keywordModel.getKeywords();

    res.json({
      success: true,
      data: {
        totalHotspots,
        unreadNotifications,
        keywordsCount: keywords.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching stats:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Health Check ====================

/**
 * GET /api/health - 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
