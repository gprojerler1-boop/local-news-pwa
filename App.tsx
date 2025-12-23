

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSettings, NewsItem } from './types';
import { 
  DEFAULT_WEB_SOURCES, 
  DEFAULT_TELEGRAM_SOURCES, 
  DEFAULT_KEYWORDS, 
  STORAGE_KEYS,
  NOTIFICATION_SOUND_URL
} from './constants';
import { fetchNewsFromSources } from './services/newsService';
import NewsCard from './components/NewsCard';
import SettingsModal from './components/SettingsModal';
import { 
  RefreshCw, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Bell, 
  BellOff,
  Search,
  History
} from 'lucide-react';

const App: React.FC = () => {
  // State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : {
      webSources: DEFAULT_WEB_SOURCES,
      telegramSources: DEFAULT_TELEGRAM_SOURCES,
      keywords: DEFAULT_KEYWORDS,
      refreshInterval: 1,
      lastUpdated: new Date().toISOString()
    };
  });

  const [news, setNews] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NEWS_LIST);
    return saved ? JSON.parse(saved) : [];
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Fixed: Use ReturnType<typeof setInterval> instead of NodeJS.Timeout to resolve "Cannot find namespace 'NodeJS'" error.
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NEWS_LIST, JSON.stringify(news));
  }, [news]);

  // Notifications
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  const notify = useCallback((item: NewsItem) => {
    if (!notificationsEnabled) return;
    
    // Sound
    if (!audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    }
    audioRef.current.play().catch(() => {});

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`خبر عاجل: ${item.source}`, {
        body: item.title,
        icon: item.screenshot
      });
    }
  }, [notificationsEnabled]);

  // Fetch Logic
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    const { items, logs: fetchLogs } = await fetchNewsFromSources(settings);
    
    setLogs(prev => [...fetchLogs, ...prev].slice(0, 50));
    
    if (items.length > 0) {
      const storedFingerprints = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINGERPRINTS) || '[]');
      const newFingerprints = items.map(i => i.fingerprint);
      localStorage.setItem(STORAGE_KEYS.FINGERPRINTS, JSON.stringify([...new Set([...storedFingerprints, ...newFingerprints])]));
      
      setNews(prev => {
        const uniqueItems = [...items, ...prev].filter((item, index, self) => 
          index === self.findIndex((t) => t.fingerprint === item.fingerprint)
        );
        return uniqueItems.sort((a, b) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());
      });

      // Notify for very first item (most recent)
      notify(items[0]);
    }

    setSettings(prev => ({ ...prev, lastUpdated: new Date().toISOString() }));
    setIsRefreshing(false);
  }, [settings, isRefreshing, notify]);

  // Auto-refresh timer
  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    
    refreshTimerRef.current = setInterval(() => {
      handleRefresh();
    }, settings.refreshInterval * 60 * 1000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [settings.refreshInterval, handleRefresh]);

  // Management Handlers
  const handleDelete = (id: string) => {
    const item = news.find(n => n.id === id);
    if (item) {
      // Blacklist fingerprint
      const blacklist = JSON.parse(localStorage.getItem(STORAGE_KEYS.BLACKLIST) || '[]');
      localStorage.setItem(STORAGE_KEYS.BLACKLIST, JSON.stringify([...new Set([...blacklist, item.fingerprint])]));
      setNews(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleEdit = (item: NewsItem) => {
    const newTitle = prompt('تعديل العنوان:', item.title);
    if (newTitle) {
      setNews(prev => prev.map(n => n.id === item.id ? { ...n, title: newTitle } : n));
    }
  };

  const handleShare = (item: NewsItem) => {
    const text = `🚨 *${item.source}* | خبر عاجل\n\n${item.title}\n\n${item.content}\n\n📍 الكلمات المطابقة: ${item.matchedKeywords.join(', ')}\n\n🔗 المصدر: ${item.url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const clearLogs = () => setLogs([]);

  // Filtering news for display
  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 bg-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 py-4 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/40">
              <History className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-none">Gaza Tracker</h1>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">PRO MONITORING SYSTEM</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`p-2 rounded-full transition-all ${notificationsEnabled ? 'text-blue-400 bg-blue-900/20' : 'text-slate-500 bg-slate-800'}`}
              title={notificationsEnabled ? "تنبيهات مفعلة" : "تنبيهات معطلة"}
            >
              {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all shadow-md"
              title="الإعدادات"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-lg ${isRefreshing ? 'animate-pulse' : ''}`}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: News Feed */}
        <div className="lg:col-span-8 space-y-6">
          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث في الأخبار المرصودة..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Feed Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              الأخبار المحدثة (آخر 120 دقيقة)
            </h2>
            <span className="text-xs text-slate-400">عدد الأخبار: {filteredNews.length}</span>
          </div>

          {/* Feed Content */}
          {filteredNews.length === 0 ? (
            <div className="bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl p-12 text-center">
              <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw size={32} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-semibold">لا يوجد أخبار حالية تطابق الشروط الصارمة</p>
              <p className="text-slate-500 text-xs mt-2">سيتم التحديث تلقائياً كل {settings.refreshInterval} دقيقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredNews.map(item => (
                <NewsCard 
                  key={item.id} 
                  item={item} 
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: System Status & Logs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-500" /> حالة النظام
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">المواقع النشطة</span>
                <span className="font-mono text-blue-400">{settings.webSources.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">قنوات تلجرام</span>
                <span className="font-mono text-blue-400">{settings.telegramSources.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">آخر فحص ناجح</span>
                <span className="font-mono text-xs">{new Date(settings.lastUpdated).toLocaleTimeString()}</span>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
                   المناطق المشمولة بالرصد
                </div>
                <div className="flex flex-wrap gap-1">
                  {settings.keywords.slice(0, 8).map(k => (
                    <span key={k} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                      {k}
                    </span>
                  ))}
                  {settings.keywords.length > 8 && <span className="text-[10px] text-slate-500">+{settings.keywords.length - 8} المزيد</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Logs Terminal */}
          <div className="bg-black border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">System Console</span>
              <button onClick={clearLogs} className="text-slate-500 hover:text-white transition-colors">
                <RefreshCw size={12} />
              </button>
            </div>
            <div className="p-4 h-64 overflow-y-auto font-mono text-[10px] space-y-2 bg-slate-950/50">
              {logs.length === 0 ? (
                <div className="text-slate-700 text-center py-10 italic">Initializing logging system...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`flex gap-2 ${log.includes('Rejected') ? 'text-red-400/80' : 'text-slate-400'}`}>
                    <span className="text-slate-600">[{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warning Note */}
          <div className="bg-yellow-900/10 border border-yellow-900/30 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
            <p className="text-[10px] text-yellow-600/80 leading-relaxed font-semibold">
              يتم استبعاد أي خبر لا يحتوي على تاريخ واضح، أو يتجاوز عمره 120 دقيقة، أو لا يتطابق مع الكلمات المفتاحية المحددة لضمان أقصى درجات الدقة.
            </p>
          </div>
        </div>
      </main>

      <SettingsModal 
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(newSettings) => {
          setSettings(newSettings);
          setIsSettingsOpen(false);
        }}
      />

      {/* Persistent Bottom Nav for Mobile/Action */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 sm:hidden">
        <button 
          onClick={handleRefresh}
          className="bg-blue-600 text-white p-4 rounded-full shadow-2xl shadow-blue-500/50 active:scale-90 transition-transform"
        >
          <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={28} />
        </button>
      </div>
    </div>
  );
};

export default App;