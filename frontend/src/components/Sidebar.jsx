import React from 'react';
import {
  Home,
  Tag,
  Flame,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', name: '仪表板', icon: Home },
    { id: 'keywords', name: '关键词', icon: Tag },
    { id: 'hotspots', name: '热点', icon: Flame },
    { id: 'settings', name: '设置', icon: Settings },
  ];

  return (
    <aside className="hidden sm:block glass h-screen sticky top-16 w-64 p-6 border-r border-white/20">
      <nav className="space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-white/10 transition">
          <LogOut className="w-5 h-5" />
          <span>退出</span>
        </button>
      </div>
    </aside>
  );
}
