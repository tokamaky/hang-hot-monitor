import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useHotspots } from '../hooks/useHotspots.js';
import HotspotCard from '../components/HotspotCard.jsx';

export default function Hotspots() {
  const { hotspots, loading, error, pagination, fetchHotspots, searchHotspots } =
    useHotspots();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchHotspots(50, 0);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchHotspots(50, 0);
      return;
    }

    setIsSearching(true);
    await searchHotspots(searchQuery);
    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchHotspots(50, 0);
  };

  const sourceStats = {
    web: hotspots.filter((h) => h.source === 'web').length,
    twitter: hotspots.filter((h) => h.source === 'twitter').length,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <h1 className="text-3xl font-bold gradient-text">热点监控</h1>
        <p className="text-gray-600 mt-2">
          实时热点列表 · 共 {pagination.total || hotspots.length} 条
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass p-6 rounded-lg border border-white/20">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索热点内容..."
              className="w-full px-4 py-3 rounded-lg border border-white/20 glass focus:outline-none focus:border-red-500 transition"
            />
            <Search className="absolute right-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              清空
            </button>
          )}
        </form>
      </div>

      {/* Source Stats */}
      {!searchQuery && (
        <div className="glass p-4 rounded-lg border border-white/20">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {sourceStats.web}
              </p>
              <p className="text-sm text-gray-600 mt-1">Web热点</p>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <p className="text-2xl font-bold text-cyan-600">
                {sourceStats.twitter}
              </p>
              <p className="text-sm text-gray-600 mt-1">Twitter热点</p>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div>
              <p className="text-2xl font-bold gradient-text">
                {hotspots.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">总计</p>
            </div>
          </div>
        </div>
      )}

      {/* Hotspots Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      ) : hotspots.length === 0 ? (
        <div className="glass p-12 rounded-lg border border-white/20 text-center text-gray-500">
          <p>暂无热点数据</p>
          {searchQuery && <p className="text-sm mt-2">换个关键词试试</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotspots.map((hotspot) => (
            <HotspotCard key={hotspot.id} hotspot={hotspot} />
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className="text-center text-gray-600 text-sm">
          显示第 {pagination.offset + 1}-
          {Math.min(pagination.offset + pagination.limit, pagination.total)} 条
          （共 {pagination.total} 条）
        </div>
      )}
    </div>
  );
}
