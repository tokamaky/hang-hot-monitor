import { useState, useCallback } from 'react';
import { notificationsAPI } from '../utils/api.js';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsAPI.getAll(limit, offset);
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (id) => {
      try {
        await notificationsAPI.markAsRead(id);
        setNotifications(
          notifications.map((n) =>
            n.id === id ? { ...n, status: 'read' } : n
          )
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [notifications, unreadCount]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
  };
}
