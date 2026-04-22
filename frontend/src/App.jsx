import React, { useState } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Keywords from './pages/Keywords.jsx';
import Hotspots from './pages/Hotspots.jsx';
import Settings from './pages/Settings.jsx';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const pages = {
    dashboard: Dashboard,
    keywords: Keywords,
    hotspots: Hotspots,
    settings: Settings,
  };

  const CurrentPage = pages[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500">
      <Header />
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <CurrentPage />
        </main>
      </div>
    </div>
  );
}
