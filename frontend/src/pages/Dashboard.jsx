import React, { useEffect, useState } from 'react';
import { TrendingUp, Eye, AlertCircle } from 'lucide-react';
import { useKeywords } from '../hooks/useKeywords.js';
import { useHotspots } from '../hooks/useHotspots.js';
import { useNotifications } from '../hooks/useNotifications.js';
import { statsAPI } from '../utils/api.js';
import HotspotCard from '../components/HotspotCard.jsx';

export default function Dashboard() {
  const { keywords, fetchKeywords } = useKeywords();
  const { hotspots, fetchHotspots } = useHotspots();
  const { unreadCount, fetchNotifications } = useNotifications();
  const [stats, setStats] = useState({
    totalHotspots: 0,
    unreadNotifications: 0,
    keywordsCount: 0,
  });

  useEffect(() => {
    Promise.all([
      fetchKeywords(),
      fetchHotspots(10, 0),
      fetchNotifications(),
      statsAPI.getStats().then((res) => setStats(res.data.data)),
    ]);
  }, []);

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="glass p-6 rounded-lg border border-white/20 card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`p-4 ${color.replace('text', 'bg')}/20 rounded-lg`}>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div className="glass p-8 rounded-lg border border-white/20 bg-gradient-to-r from-red-500/20 to-pink-500/20">
        <h1 className="text-4xl font-bold gradient-text">欢迎回来！</h1>
        <p className="text-gray-700 mt-2">
          实时监控热点，第一时间掌握行业动态
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          label="总热点数"
          value={stats.totalHotspots}
          color="text-red-600"
        />
        <StatCard
          icon={Eye}
          label="未读通知"
          value={unreadCount}
          color="text-blue-600"
        />
        <StatCard
          icon={AlertCircle}
          label="监控关键词"
          value={keywords.length}
          color="text-green-600"
        />
      </div>

      {/* Latest Hotspots */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🔥 最新热点</h2>
          <a href="#hotspots" className="text-red-600 hover:text-red-700 font-medium">
            查看全部 →
          </a>
        </div>

        {hotspots.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>暂无热点数据</p>
            <p className="text-sm mt-2">添加关键词后将自动监控</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotspots.slice(0, 4).map((hotspot) => (
              <HotspotCard key={hotspot.id} hotspot={hotspot} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 快速统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold gradient-text">
              {Math.floor(hotspots.length / Math.max(keywords.length, 1))}
            </p>
            <p className="text-xs text-gray-600 mt-1">平均/关键词</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {hotspots.filter((h) => h.source === 'twitter').length}
            </p>
            <p className="text-xs text-gray-600 mt-1">Twitter热点</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-600">
              {hotspots.filter((h) => h.source === 'web').length}
            </p>
            <p className="text-xs text-gray-600 mt-1">Web热点</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {hotspots.filter((h) => h.ai_score >= 7).length}
            </p>
            <p className="text-xs text-gray-600 mt-1">高热度</p>
          </div>
        </div>
      </div>
    </div>
  );
}
