import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications.js';
import { formatDistanceToNow } from '../utils/date-utils.js';

export default function NotificationCenter() {
  const { notifications, unreadCount, fetchNotifications, markAsRead } =
    useNotifications();

  useEffect(() => {
    fetchNotifications(10, 0);
  }, []);

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-h-96 glass rounded-lg shadow-2xl border border-white/20 overflow-hidden animate-slideIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4">
        <h3 className="font-bold text-lg">通知中心</h3>
        {unreadCount > 0 && (
          <p className="text-sm text-white/80">{unreadCount} 条未读</p>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-80">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>暂无通知</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 border-b border-white/10 hover:bg-white/5 transition ${
                notif.status === 'unread' ? 'bg-blue-50/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    关键词: {notif.keyword}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notif.created_at))}前
                  </p>
                </div>
                {notif.status === 'unread' && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="p-1 hover:bg-white/10 rounded transition"
                    title="标记为已读"
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-white/5 p-3 text-center">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
          查看全部通知
        </button>
      </div>
    </div>
  );
}
