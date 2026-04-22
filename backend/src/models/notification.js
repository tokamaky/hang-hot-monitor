import { getDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

export async function addNotification(keywordId, hotspotId) {
  const db = await getDatabase();
  try {
    // 检查是否已存在
    const existing = await db.get(
      'SELECT * FROM notifications WHERE keyword_id = ? AND hotspot_id = ?',
      [keywordId, hotspotId]
    );

    if (existing) {
      return existing;
    }

    const result = await db.run(
      `INSERT INTO notifications (keyword_id, hotspot_id, status)
       VALUES (?, ?, 'unread')`,
      [keywordId, hotspotId]
    );
    logger.success('Notification created:', `keyword=${keywordId}, hotspot=${hotspotId}`);
    return result;
  } catch (error) {
    logger.error('Error adding notification:', error.message);
    throw error;
  }
}

export async function getNotifications(limit = 50, offset = 0) {
  const db = await getDatabase();
  try {
    const notifications = await db.all(
      `SELECT n.*, k.keyword, h.title, h.source, h.url, h.created_at as hotspot_created_at
       FROM notifications n
       LEFT JOIN keywords k ON n.keyword_id = k.id
       LEFT JOIN hotspots h ON n.hotspot_id = h.id
       WHERE n.status = 'unread'
       ORDER BY n.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return notifications || [];
  } catch (error) {
    logger.error('Error fetching notifications:', error.message);
    return [];
  }
}

export async function markAsRead(notificationId) {
  const db = await getDatabase();
  try {
    await db.run(
      'UPDATE notifications SET status = ? WHERE id = ?',
      ['read', notificationId]
    );
    logger.success('Notification marked as read:', notificationId);
  } catch (error) {
    logger.error('Error marking notification as read:', error.message);
    throw error;
  }
}

export async function markEmailSent(notificationId) {
  const db = await getDatabase();
  try {
    await db.run(
      'UPDATE notifications SET email_sent = 1 WHERE id = ?',
      [notificationId]
    );
  } catch (error) {
    logger.error('Error marking email as sent:', error.message);
    throw error;
  }
}

export async function countUnreadNotifications() {
  const db = await getDatabase();
  try {
    const result = await db.get(
      "SELECT COUNT(*) as count FROM notifications WHERE status = 'unread'"
    );
    return result?.count || 0;
  } catch (error) {
    logger.error('Error counting notifications:', error.message);
    return 0;
  }
}

export default {
  addNotification,
  getNotifications,
  markAsRead,
  markEmailSent,
  countUnreadNotifications,
};
