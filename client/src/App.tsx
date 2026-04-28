import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Search, Plus, Bell, Trash2,
  ExternalLink, RefreshCw, X, Check, AlertTriangle,
  Zap, TrendingUp, Twitter, Globe, Eye, Activity, Clock, Target,
  ChevronLeft, ChevronRight,
  MessageCircle, Repeat2, User, Shield, ShieldAlert,
  ChevronDown, ChevronUp, ChevronsUpDown, ThermometerSun, FileText, Languages,
  Rss, Tag, BarChart3, LogOut
} from 'lucide-react';
import {
  keywordsApi, hotspotsApi, notificationsApi, triggerHotspotCheck,
  type Keyword, type Hotspot, type Stats, type Notification, type CurrentUser,
  authApi, setAccessToken, clearAccessToken
} from './services/api';
import { onNewHotspot, onNotification, subscribeToKeywords, disconnectSocket } from './services/socket';
import { cn } from './lib/utils';
import { Spotlight } from './components/ui/spotlight';
import { Meteors } from './components/ui/meteors';
import FilterSortBar, { defaultFilterState, type FilterState } from './components/FilterSortBar';
import { sortHotspots } from './utils/sortHotspots';
import { relativeTime } from './utils/relativeTime';
import { useI18n } from './i18n/index.tsx';
import Login from './pages/Login';

interface LoginProps {
  onSuccess: (token: string, user: CurrentUser) => void;
}

function calcHeatScore(h: Hotspot): number {
  const likes = h.likeCount ?? 0;
  const retweets = h.retweetCount ?? 0;
  const replies = h.replyCount ?? 0;
  const comments = h.commentCount ?? 0;
  const quotes = h.quoteCount ?? 0;
  const views = h.viewCount ?? 0;
  const raw = likes * 2 + retweets * 3 + replies * 1.5 + comments * 1.5 + quotes * 2 + views / 100;
  if (raw <= 0) return 0;
  return Math.min(100, Math.round(Math.log10(raw + 1) * 25));
}

function App() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newKeyword, setNewKeyword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'keywords' | 'search'>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dashboardFilters, setDashboardFilters] = useState<FilterState>({ ...defaultFilterState });
  const [searchFilters, setSearchFilters] = useState<FilterState>({ ...defaultFilterState });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchResults, setSearchResults] = useState<Hotspot[]>([]);
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set());
  const [expandedContents, setExpandedContents] = useState<Set<string>>(new Set());
  const [allReasonsExpanded, setAllReasonsExpanded] = useState(false);
  const { t, language, toggleLanguage } = useI18n();

  // ─── Auth state ───
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check for token from OAuth callback URL
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  const errorFromUrl = urlParams.get('error');

  // If token in URL, store it and fetch user info
  useEffect(() => {
    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl);
      // Immediately fetch user info with the new token
      authApi.getMeWithToken(tokenFromUrl)
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          clearAccessToken();
          setLoginError('Authentication failed');
        })
        .finally(() => {
          setAuthLoading(false);
          // Clean URL without refresh
          window.history.replaceState({}, '', window.location.pathname);
        });
      return; // Don't proceed with normal auth check
    }
    if (errorFromUrl) {
      setLoginError(errorFromUrl);
      setAuthLoading(false);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [tokenFromUrl, errorFromUrl]);

  // Verify token and load user on mount (only if no OAuth callback)
  useEffect(() => {
    if (tokenFromUrl || errorFromUrl) return; // Skip if handling OAuth callback

    const token = sessionStorage.getItem('accessToken');
    if (token) {
      setAccessToken(token);
      authApi.getMe()
        .then((user) => {
          setCurrentUser(user);
        })
        .catch(() => {
          clearAccessToken();
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, [tokenFromUrl, errorFromUrl]);

  const handleLogin = () => {
    authApi.githubLogin();
  };

  const handleLogout = async () => {
    await authApi.logout();
    disconnectSocket();
    setCurrentUser(null);
  };

  function getHeatLevel(score: number): { label: string; color: string } {
    if (score >= 80) return { label: t.heat.explosive, color: 'text-red-400' };
    if (score >= 60) return { label: t.heat.hot, color: 'text-orange-400' };
    if (score >= 40) return { label: t.heat.warm, color: 'text-amber-400' };
    if (score >= 20) return { label: t.heat.cool, color: 'text-blue-400' };
    return { label: t.heat.cold, color: 'text-slate-500' };
  }

  function getImportanceColor(importance: string): { bg: string; text: string; border: string; dot: string } {
    switch (importance) {
      case 'urgent': return { bg: 'bg-red-500/12', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' };
      case 'high': return { bg: 'bg-purple-500/12', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-400' };
      case 'medium': return { bg: 'bg-amber-500/12', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' };
      default: return { bg: 'bg-emerald-500/12', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' };
    }
  }

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const filterParams: Record<string, string | number> = {
        limit: 20,
        page: currentPage,
      };
      if (dashboardFilters.source) filterParams.source = dashboardFilters.source;
      if (dashboardFilters.importance) filterParams.importance = dashboardFilters.importance;
      if (dashboardFilters.keywordId) filterParams.keywordId = dashboardFilters.keywordId;
      if (dashboardFilters.timeRange) filterParams.timeRange = dashboardFilters.timeRange;
      if (dashboardFilters.isReal) filterParams.isReal = dashboardFilters.isReal;
      if (dashboardFilters.sortBy) filterParams.sortBy = dashboardFilters.sortBy;
      if (dashboardFilters.sortOrder) filterParams.sortOrder = dashboardFilters.sortOrder;

      const [keywordsData, hotspotsData, statsData, notifData] = await Promise.all([
        keywordsApi.getAll(),
        hotspotsApi.getAll(filterParams as any),
        hotspotsApi.getStats(),
        notificationsApi.getAll({ limit: 20 })
      ]);
      setKeywords(keywordsData);
      setHotspots(hotspotsData.data);
      setTotalPages(hotspotsData.pagination.totalPages);
      setStats(statsData);
      setNotifications(notifData.data);
      setUnreadCount(notifData.unreadCount);
      const activeKeywords = keywordsData.filter(k => k.isActive).map(k => k.text);
      if (activeKeywords.length > 0) {
        subscribeToKeywords(activeKeywords).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardFilters, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [dashboardFilters]);
  useEffect(() => { 
    if (currentUser) loadData(); 
  }, [currentUser, loadData]);

  useEffect(() => {
    let unsubHotspot: (() => void) | null = null;
    let unsubNotif: (() => void) | null = null;

    onNewHotspot((hotspot) => {
      setHotspots(prev => [hotspot as Hotspot, ...prev.slice(0, 19)]);
      showToast(`${t.notifications.newHotspot}: ` + hotspot.title.slice(0, 30), 'success');
      loadData();
    }).then(unsub => { unsubHotspot = unsub; });

    onNotification(() => { setUnreadCount(prev => prev + 1); })
      .then(unsub => { unsubNotif = unsub; });

    return () => {
      unsubHotspot?.();
      unsubNotif?.();
    };
  }, [loadData, t.notifications.newHotspot]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      const keyword = await keywordsApi.create({ text: newKeyword.trim() });
      setKeywords(prev => [keyword, ...prev]);
      setNewKeyword('');
      showToast(t.keywords.keywordAdded, 'success');
      subscribeToKeywords([keyword.text]).catch(console.error);
    } catch (error: any) {
      showToast(error.message || t.keywords.addFailed, 'error');
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    try {
      await keywordsApi.delete(id);
      setKeywords(prev => prev.filter(k => k.id !== id));
      showToast(t.keywords.keywordDeleted, 'success');
    } catch (error) {
      showToast(t.keywords.deleteFailed, 'error');
    }
  };

  const handleToggleKeyword = async (id: string) => {
    try {
      const updated = await keywordsApi.toggle(id);
      setKeywords(prev => prev.map(k => k.id === id ? updated : k));
    } catch (error) {
      showToast(t.keywords.toggleFailed, 'error');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const result = await hotspotsApi.search(searchQuery);
      setSearchResults(result.results);
      showToast(`${t.search.found} ${result.results.length} ${t.search.results}`, 'success');
    } catch (error) {
      showToast(t.notifications.searchFailed, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await triggerHotspotCheck();
      showToast(t.notifications.hotspotCheckTriggered, 'success');
      setTimeout(loadData, 5000);
    } catch (error) {
      showToast(t.notifications.checkFailed, 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) { console.error('Failed to mark as read:', error); }
  };

  const toggleReason = (id: string) => {
    setExpandedReasons(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleContent = (id: string) => {
    setExpandedContents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllReasons = (list: Hotspot[]) => {
    if (allReasonsExpanded) {
      setExpandedReasons(new Set());
    } else {
      setExpandedReasons(new Set(list.filter(h => h.relevanceReason).map(h => h.id)));
    }
    setAllReasonsExpanded(!allReasonsExpanded);
  };

  const filteredSearchResults = useMemo(() => {
    let results = [...searchResults];
    if (searchFilters.source) results = results.filter(h => h.source === searchFilters.source);
    if (searchFilters.importance) results = results.filter(h => h.importance === searchFilters.importance);
    if (searchFilters.isReal === 'true') results = results.filter(h => h.isReal);
    else if (searchFilters.isReal === 'false') results = results.filter(h => !h.isReal);
    if (searchFilters.keywordId) results = results.filter(h => h.keyword?.id === searchFilters.keywordId);
    if (searchFilters.timeRange) {
      const now = new Date();
      let dateFrom: Date | null = null;
      switch (searchFilters.timeRange) {
        case '1h': dateFrom = new Date(now.getTime() - 60 * 60 * 1000); break;
        case 'today': dateFrom = new Date(now); dateFrom.setHours(0, 0, 0, 0); break;
        case '7d': dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case '30d': dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      }
      if (dateFrom) results = results.filter(h => new Date(h.createdAt) >= dateFrom!);
    }
    results = sortHotspots(results, searchFilters.sortBy || 'createdAt', (searchFilters.sortOrder || 'desc') as 'asc' | 'desc');
    return results;
  }, [searchResults, searchFilters]);

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'urgent': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'high': return <Flame className="w-3.5 h-3.5" />;
      case 'medium': return <Zap className="w-3.5 h-3.5" />;
      default: return <TrendingUp className="w-3.5 h-3.5" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'twitter': return <Twitter className="w-3.5 h-3.5" />;
      case 'bilibili': return <Eye className="w-3.5 h-3.5" />;
      case 'weibo': return <Activity className="w-3.5 h-3.5" />;
      case 'sogou': return <Search className="w-3.5 h-3.5" />;
      case 'hackernews': return <Zap className="w-3.5 h-3.5" />;
      default: return <Globe className="w-3.5 h-3.5" />;
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      twitter: t.sources.twitter, bing: t.sources.bing, google: t.sources.google,
      sogou: t.sources.sogou, bilibili: t.sources.bilibili, weibo: t.sources.weibo,
      hackernews: t.sources.hackernews, duckduckgo: t.sources.duckduckgo
    };
    return labels[source] || source;
  };

  // ─── Auth guard ───
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05050f]">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login error={loginError || undefined} onLogin={handleLogin} onSuccess={(token, user) => {
      setAccessToken(token);
      setCurrentUser(user);
      setLoginError(null);
      // Clear old data before loading new user data
      setKeywords([]);
      setHotspots([]);
      setStats(null);
      setNotifications([]);
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#05050f] relative overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#7c3aed" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              "fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl flex items-center gap-3 shadow-2xl backdrop-blur-xl",
              toast.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-400'
                : 'bg-red-500/15 border border-red-500/25 text-red-400'
            )}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl"
        style={{ background: 'rgba(5, 5, 15, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)' }}>
                  <Flame className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#05050f] animate-pulse" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white tracking-tight leading-none">{t.app.title}</h1>
                <p className="text-[11px] text-slate-500 mt-0.5">{t.app.subtitle}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
              >
                <Languages className="w-3.5 h-3.5" />
                {language === 'en' ? '中文' : 'EN'}
              </button>

              {/* User avatar + logout */}
              <div className="flex items-center gap-1.5 pl-1">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  {currentUser.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              <motion.button
                onClick={handleManualCheck}
                disabled={isChecking}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200",
                  isChecking
                    ? "text-violet-400 cursor-wait"
                    : "text-white shadow-lg"
                )}
                style={!isChecking ? { background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' } : { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isChecking && "animate-spin")} />
                {isChecking ? t.header.scanning : t.header.scanNow}
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-11 w-80 rounded-xl overflow-hidden"
                      style={{ background: 'rgba(9, 9, 26, 0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                    >
                      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 className="text-sm font-medium text-white">{t.header.notifications}</h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[11px] text-violet-400 hover:text-violet-300 font-medium">
                            {t.header.markAllRead}
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-slate-500 text-sm text-center py-10">{t.header.noNotifications}</p>
                        ) : (
                          <div>
                            {notifications.slice(0, 5).map(n => (
                              <div key={n.id} className={cn("px-4 py-3 transition-colors", !n.isRead ? 'hover:bg-white/[0.03]' : 'opacity-40')}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <p className="text-[13px] font-medium text-white leading-snug">{n.title}</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{n.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-7">

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 mb-8 p-1 rounded-xl w-fit"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {([
            { key: 'dashboard', label: t.tabs.dashboard, icon: Rss },
            { key: 'keywords', label: t.tabs.keywords, icon: Tag },
            { key: 'search', label: t.tabs.search, icon: Search },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
                activeTab === key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              )}
              style={activeTab === key ? { background: 'rgba(124,58,237,0.2)', boxShadow: '0 0 16px rgba(124,58,237,0.15)' } : {}}
            >
              {activeTab === key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-up">

            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                  className="group relative p-4 rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', transform: 'translate(30%, -30%)' }} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">{t.dashboard.totalHotspots}</p>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(124,58,237,0.15)' }}>
                      <BarChart3 className="w-4 h-4 text-violet-400" />
                    </div>
                  </div>
                  {/* Mini sparkline */}
                  <div className="flex items-end gap-0.5 mt-3 h-6">
                    {[40, 55, 45, 70, 60, 80, 65].map((h, i) => (
                      <div key={i} className="w-1.5 rounded-sm transition-all" style={{ height: `${h}%`, background: 'rgba(124,58,237,0.3)', opacity: i === 6 ? 1 : 0.5 }} />
                    ))}
                  </div>
                </motion.div>

                {/* Today */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="group relative p-4 rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', transform: 'translate(30%, -30%)' }} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">{t.dashboard.todayNew}</p>
                      <p className="text-2xl font-bold" style={{ color: '#06b6d4' }}>{stats.today}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(6,182,212,0.12)' }}>
                      <Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                  <div className="flex items-end gap-0.5 mt-3 h-6">
                    {[20, 35, 25, 45, 30, 50, 40].map((h, i) => (
                      <div key={i} className="w-1.5 rounded-sm" style={{ height: `${h}%`, background: 'rgba(6,182,212,0.3)', opacity: i === 6 ? 1 : 0.5 }} />
                    ))}
                  </div>
                </motion.div>

                {/* Urgent */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="group relative p-4 rounded-xl overflow-hidden"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <Meteors number={4} />
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #ef4444, transparent)', transform: 'translate(30%, -30%)' }} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">{t.dashboard.urgentHotspots}</p>
                      <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(239,68,68,0.12)' }}>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                  <div className="flex items-end gap-0.5 mt-3 h-6">
                    {[30, 20, 45, 35, 25, 40, 55].map((h, i) => (
                      <div key={i} className="w-1.5 rounded-sm" style={{ height: `${h}%`, background: 'rgba(239,68,68,0.3)', opacity: i === 6 ? 1 : 0.5 }} />
                    ))}
                  </div>
                </motion.div>

                {/* Keywords */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="group relative p-4 rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #10b981, transparent)', transform: 'translate(30%, -30%)' }} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-2">{t.dashboard.monitorKeywords}</p>
                      <p className="text-2xl font-bold text-emerald-400">{keywords.filter(k => k.isActive).length}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(16,185,129,0.12)' }}>
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex items-end gap-0.5 mt-3 h-6">
                    {[10, 15, 10, 20, 15, 25, 20].map((h, i) => (
                      <div key={i} className="w-1.5 rounded-sm" style={{ height: `${h}%`, background: 'rgba(16,185,129,0.3)', opacity: i === 6 ? 1 : 0.5 }} />
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Feed Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(249,115,22,0.15)' }}>
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">{t.dashboard.realtimeStream}</h2>
                </div>
                <span className="text-[11px] text-slate-600">{t.dashboard.autoUpdate}</span>
              </div>

              <FilterSortBar
                filters={dashboardFilters}
                onChange={setDashboardFilters}
                keywords={keywords}
              />

              {/* Loading */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
                  </div>
                  <p className="text-sm text-slate-500">Loading hotspots...</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && hotspots.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
                    <svg className="w-8 h-8 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-400">{t.dashboard.noHotspots}</p>
                    <p className="text-xs text-slate-600 mt-1">{t.dashboard.noHotspotsHint}</p>
                  </div>
                </div>
              )}

              {/* Hotspot List */}
              {!isLoading && hotspots.length > 0 && (
                <div className="space-y-2.5 mt-3">
                  {hotspots.some(h => h.relevanceReason) && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => toggleAllReasons(hotspots)}
                        className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-violet-400 transition-colors px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                      >
                        <ChevronsUpDown className="w-3 h-3" />
                        {allReasonsExpanded ? t.dashboard.collapseAll : t.dashboard.expandAll}
                      </button>
                    </div>
                  )}

                  {hotspots.map((hotspot, index) => {
                    const heatScore = calcHeatScore(hotspot);
                    const heat = getHeatLevel(heatScore);
                    const impColor = getImportanceColor(hotspot.importance);
                    return (
                    <motion.div
                      key={hotspot.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      className="group rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {/* Importance top bar */}
                      <div className="h-0.5 w-full" style={{
                        background: hotspot.importance === 'urgent' ? 'linear-gradient(90deg, #ef4444, transparent)' :
                          hotspot.importance === 'high' ? 'linear-gradient(90deg, #a855f7, transparent)' :
                          hotspot.importance === 'medium' ? 'linear-gradient(90deg, #f59e0b, transparent)' :
                          'linear-gradient(90deg, #10b981, transparent)'
                      }} />

                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Importance badge */}
                          <div className={cn("shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide", impColor.bg, impColor.text)}>
                            {getImportanceIcon(hotspot.importance)}
                            <span>{t.importance[hotspot.importance as keyof typeof t.importance]}</span>
                          </div>

                          {/* Source */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            {getSourceIcon(hotspot.source)}
                            <span>{getSourceLabel(hotspot.source)}</span>
                          </div>

                          {/* Keyword */}
                          {hotspot.keyword && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                              {hotspot.keyword.text}
                            </span>
                          )}

                          {/* Authenticity */}
                          {!hotspot.isReal && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                              <ShieldAlert className="w-3 h-3" />
                              {t.dashboard.suspicious}
                            </span>
                          )}
                          {hotspot.isReal && hotspot.relevance >= 80 && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }}>
                              <Shield className="w-3 h-3" />
                              {t.dashboard.trusted}
                            </span>
                          )}

                          {/* Mention */}
                          {hotspot.keywordMentioned === true && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.15)' }}>
                              <Target className="w-3 h-3" />
                              {t.dashboard.directMention}
                            </span>
                          )}
                          {hotspot.keywordMentioned === false && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)' }}>
                              <Target className="w-3 h-3" />
                              {t.dashboard.indirectRelated}
                            </span>
                          )}

                          {/* Heat */}
                          <span className={cn("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border", heat.color, "bg-white/5 border-white/10")}>
                            <ThermometerSun className="w-3 h-3" />
                            {heat.label} {heatScore}
                          </span>

                          {/* Spacer */}
                          <div className="flex-1" />

                          {/* External Link */}
                          <a
                            href={hotspot.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-violet-400 transition-all duration-200 opacity-0 group-hover:opacity-100"
                            style={{ background: 'rgba(255,255,255,0.04)' }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Title */}
                        <h3 className="mt-2.5 font-medium text-[14px] text-white leading-snug group-hover:text-violet-300 transition-colors line-clamp-2">
                          {hotspot.title}
                        </h3>

                        {/* AI Summary */}
                        {hotspot.summary && (
                          <p className="mt-1.5 text-[12px] text-slate-500 leading-relaxed line-clamp-2">{hotspot.summary}</p>
                        )}

                        {/* Author */}
                        {hotspot.authorName && (
                          <div className="flex items-center gap-2 mt-2">
                            {hotspot.authorAvatar ? (
                              <img src={hotspot.authorAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-600" />
                            )}
                            <span className="text-[11px] text-slate-400">{hotspot.authorName}</span>
                            {hotspot.authorUsername && <span className="text-[11px] text-slate-600">@{hotspot.authorUsername}</span>}
                            {hotspot.authorVerified && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>Verified</span>
                            )}
                            {hotspot.authorFollowers != null && hotspot.authorFollowers > 0 && (
                              <span className="text-[11px] text-slate-600">{hotspot.authorFollowers.toLocaleString()} {t.dashboard.followers}</span>
                            )}
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <Target className="w-3 h-3" />
                            {hotspot.relevance}% {t.dashboard.relevance}
                          </span>
                          {hotspot.likeCount != null && hotspot.likeCount > 0 && (
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{hotspot.likeCount.toLocaleString()}</span>
                          )}
                          {hotspot.retweetCount != null && hotspot.retweetCount > 0 && (
                            <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" />{hotspot.retweetCount.toLocaleString()}</span>
                          )}
                          {hotspot.replyCount != null && hotspot.replyCount > 0 && (
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{hotspot.replyCount.toLocaleString()}</span>
                          )}
                          {hotspot.viewCount != null && hotspot.viewCount > 0 && (
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{hotspot.viewCount.toLocaleString()}</span>
                          )}
                          {hotspot.danmakuCount != null && hotspot.danmakuCount > 0 && (
                            <span className="flex items-center gap-1">{'💬'} {hotspot.danmakuCount.toLocaleString()}</span>
                          )}
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                          {hotspot.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {relativeTime(hotspot.publishedAt)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {relativeTime(hotspot.createdAt)}
                          </span>
                        </div>

                        {/* Expandable Sections */}
                        {(hotspot.relevanceReason || (hotspot.content && hotspot.content !== hotspot.summary)) && (
                          <div className="mt-2 space-y-1">
                            {hotspot.relevanceReason && (
                              <button
                                onClick={() => toggleReason(hotspot.id)}
                                className="flex items-center gap-1 text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors"
                              >
                                {expandedReasons.has(hotspot.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {t.dashboard.aiReason}
                              </button>
                            )}
                            <AnimatePresence>
                              {expandedReasons.has(hotspot.id) && hotspot.relevanceReason && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                  <p className="text-[11px] text-slate-500 pl-4 leading-relaxed mt-1"
                                    style={{ borderLeft: '2px solid rgba(124,58,237,0.2)' }}>
                                    {hotspot.relevanceReason}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {hotspot.content && hotspot.content !== hotspot.summary && (
                              <button
                                onClick={() => toggleContent(hotspot.id)}
                                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                {expandedContents.has(hotspot.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <FileText className="w-3 h-3" />
                                {t.dashboard.originalContent}
                              </button>
                            )}
                            <AnimatePresence>
                              {expandedContents.has(hotspot.id) && hotspot.content && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                  <p className="text-[11px] text-slate-500 pl-4 leading-relaxed mt-1 whitespace-pre-wrap break-words max-h-36 overflow-y-auto"
                                    style={{ borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
                                    {hotspot.content}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && !isLoading && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg text-slate-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 7) page = i + 1;
                      else if (currentPage <= 4) page = i + 1;
                      else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                      else page = currentPage - 3 + i;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-[12px] font-medium transition-all",
                            currentPage === page
                              ? "text-white"
                              : "text-slate-500 hover:text-white"
                          )}
                          style={currentPage === page ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' } : {}}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] text-slate-600 ml-1">
                    {t.pagination.of} {stats?.total || 0} {t.pagination.total}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-5 animate-fade-up">
            {/* Add Form */}
            <form onSubmit={handleAddKeyword} className="p-4 rounded-xl flex gap-3"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder={t.keywords.addPlaceholder}
                className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-600 outline-none"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 2px 12px rgba(124,58,237,0.25)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                {t.keywords.add}
              </motion.button>
            </form>

            {/* Keywords Grid */}
            <div className="grid gap-2.5 md:grid-cols-2">
              <AnimatePresence>
                {keywords.map((keyword, i) => (
                  <motion.div
                    key={keyword.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.02 }}
                    className="group flex items-center justify-between p-3.5 rounded-xl transition-all duration-200"
                    style={{
                      background: keyword.isActive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${keyword.isActive ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleKeyword(keyword.id)}
                        className={cn(
                          "w-9 h-5 rounded-full transition-all relative shrink-0",
                          keyword.isActive ? "bg-violet-600" : "bg-slate-700"
                        )}
                        style={keyword.isActive ? { boxShadow: '0 0 10px rgba(124,58,237,0.3)' } : {}}
                      >
                        <span className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all",
                          keyword.isActive ? "left-4" : "left-0.5"
                        )} />
                      </button>
                      <div>
                        <span className={cn("text-[13px] font-medium", keyword.isActive ? "text-white" : "text-slate-500")}>
                          {keyword.text}
                        </span>
                        {keyword._count && keyword._count.hotspots > 0 && (
                          <span className="ml-2 text-[11px] text-slate-600">{keyword._count.hotspots} {t.keywords.keywordsCount}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteKeyword(keyword.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: 'rgba(239,68,68,0.08)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {keywords.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <Target className="w-8 h-8 text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-400">{t.keywords.noKeywords}</p>
                  <p className="text-xs text-slate-600 mt-1">{t.keywords.noKeywordsHint}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-5 animate-fade-up">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="p-4 rounded-xl flex gap-3"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Search className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search.placeholder}
                className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-600 outline-none"
              />
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 2px 12px rgba(124,58,237,0.25)' }}
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                {t.search.searchBtn}
              </motion.button>
            </form>

            <FilterSortBar
              filters={searchFilters}
              onChange={setSearchFilters}
              keywords={keywords}
            />

            {/* Results Area */}
            <div className="space-y-2.5">
              {/* Loading */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
                  </div>
                  <p className="text-sm text-slate-500">{t.search.loading}</p>
                </div>
              )}

              {/* No results */}
              {!isLoading && searchResults.length === 0 && searchQuery.trim() !== '' && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
                    <Search className="w-8 h-8 text-red-400/60" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-400">{t.search.noResults}</p>
                    <p className="text-xs text-slate-600 mt-1">{t.search.noResultsHint}</p>
                  </div>
                </div>
              )}

              {/* Filtered empty */}
              {filteredSearchResults.length === 0 && searchResults.length > 0 && !isLoading && (
                <div className="text-center py-12 rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.07)' }}>
                  <p className="text-sm text-slate-500">{t.search.noResults}</p>
                  <p className="text-xs text-slate-600 mt-1">{t.search.noResultsHint}</p>
                </div>
              )}

              {/* Results */}
              {!isLoading && filteredSearchResults.length > 0 && filteredSearchResults.map((hotspot, i) => {
                const heatScore = calcHeatScore(hotspot);
                const heat = getHeatLevel(heatScore);
                const impColor = getImportanceColor(hotspot.importance);
                return (
                <motion.div
                  key={hotspot.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="h-0.5 w-full" style={{
                    background: hotspot.importance === 'urgent' ? 'linear-gradient(90deg, #ef4444, transparent)' :
                      hotspot.importance === 'high' ? 'linear-gradient(90deg, #a855f7, transparent)' :
                      hotspot.importance === 'medium' ? 'linear-gradient(90deg, #f59e0b, transparent)' :
                      'linear-gradient(90deg, #10b981, transparent)'
                  }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide", impColor.bg, impColor.text)}>
                            {getImportanceIcon(hotspot.importance)}
                            <span>{t.importance[hotspot.importance as keyof typeof t.importance]}</span>
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            {getSourceIcon(hotspot.source)}
                            <span>{getSourceLabel(hotspot.source)}</span>
                          </span>
                          {!hotspot.isReal && (
                            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                              <ShieldAlert className="w-3 h-3" />
                              {t.dashboard.suspicious}
                            </span>
                          )}
                          <span className={cn("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border", heat.color, "bg-white/5 border-white/10")}>
                            <ThermometerSun className="w-3 h-3" />
                            {heat.label} {heatScore}
                          </span>
                        </div>
                        <h3 className="text-[14px] font-medium text-white leading-snug group-hover:text-violet-300 transition-colors">{hotspot.title}</h3>
                        {hotspot.summary && (
                          <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{hotspot.summary}</p>
                        )}
                        {hotspot.authorName && (
                          <div className="flex items-center gap-2 mt-2">
                            <User className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-[11px] text-slate-400">{hotspot.authorName}</span>
                            {hotspot.authorVerified && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa' }}>Verified</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <Target className="w-3 h-3" />
                            {hotspot.relevance}% {t.dashboard.relevance}
                          </span>
                          {hotspot.likeCount != null && hotspot.likeCount > 0 && (
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{hotspot.likeCount.toLocaleString()}</span>
                          )}
                          {hotspot.viewCount != null && hotspot.viewCount > 0 && (
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{hotspot.viewCount.toLocaleString()}</span>
                          )}
                          {hotspot.publishedAt && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{relativeTime(hotspot.publishedAt)}</span>
                          )}
                        </div>
                      </div>
                      <a
                        href={hotspot.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-200"
                        style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}
                      >
                        {t.search.seeMore}
                      </a>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
