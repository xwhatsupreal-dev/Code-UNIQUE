import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, BookOpen, LayoutGrid, Flame } from 'lucide-react';
import { RedeemCode } from './types/code';
import { INITIAL_CODES } from './data/initialCodes';
import { Navbar, MainMenuTab } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CodeCard } from './components/CodeCard';
import { BatchCopyModal } from './components/BatchCopyModal';
import { playPunchSound, playRewardChime } from './utils/audio';
import { sortCodesByNewest } from './services/codeSyncService';
import { fetchServerCodes } from './services/codeApiService';
import { AdminPortal } from './components/AdminPortal';
import { isCodeLatest } from './utils/dateFormatter';
import { Language, translations } from './utils/translations';

// Storage key specifically for user-managed custom codes
const STORAGE_KEY_USER_CODES = 'opm_user_managed_codes_v1';
const STORAGE_KEY_LANG = 'opm_lang_preference';

const TAB_ORDER: MainMenuTab[] = ['latest', 'all', 'guide'];

const GUIDE_IMAGES = [
  'https://img2.pic.in.th/1000125847.png',
  'https://img1.pic.in.th/images/1000126037.png',
  'https://img2.pic.in.th/1000126041.png',
];

// Dedicated optimized guide image with zero-lag placeholder and async decoding
const GuideStepImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-md relative min-h-[170px] sm:min-h-[220px] flex items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 bg-[#0c0d0e]/80 flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="size-2 rounded-full bg-[#29e6b2] animate-ping" />
            <span>กำลังโหลดรูป...</span>
          </div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        decoding="async"
        loading="eager"
        onLoad={() => setLoaded(true)}
        className={`w-full h-auto max-h-96 object-contain mx-auto rounded-lg transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export default function App() {
  // Simple URL routing: check if pathname is /admin or hash is #admin
  const [currentRoute, setCurrentRoute] = useState<'home' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin') {
        return 'admin';
      }
    }
    return 'home';
  });

  // Listen to popstate or hashchange
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin') {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('home');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: 'home' | 'admin') => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      const newPath = route === 'admin' ? '/admin' : '/';
      window.history.pushState({}, '', newPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Language state: 'th' or 'en' (defaults to 'th' with persistent memory)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'en' || saved === 'th') return saved;
    } catch {}
    return 'th';
  });

  const handleSelectLang = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem(STORAGE_KEY_LANG, newLang);
    } catch {}
  };

  const t = translations[lang];

  // 3 Main Menus State: 'latest' | 'all' | 'guide' with direction-aware sliding
  const [activeTab, setActiveTab] = useState<MainMenuTab>('latest');
  const [slideDirection, setSlideDirection] = useState<number>(0);

  const handleSelectTab = (newTab: MainMenuTab) => {
    if (newTab === activeTab) return;
    const prevIdx = TAB_ORDER.indexOf(activeTab);
    const newIdx = TAB_ORDER.indexOf(newTab);
    setSlideDirection(newIdx > prevIdx ? 1 : -1);
    setActiveTab(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Preload guide step screenshots in background so tab 3 loads instantly with zero lag
  useEffect(() => {
    GUIDE_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Modals State for regular players
  const [isBatchCopyModalOpen, setIsBatchCopyModalOpen] = useState(false);

  // Codes State: loaded from local storage and updated via server/Cloudflare
  const [codes, setCodes] = useState<RedeemCode[]>(() => {
    try {
      localStorage.removeItem('opm_codes_sea_v2');
      localStorage.removeItem('opm_last_sync_timestamp');
      localStorage.removeItem('opm_source_last_modified');
      localStorage.removeItem('opm_notif_settings');
    } catch {}

    const saved = localStorage.getItem(STORAGE_KEY_USER_CODES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanCodes = parsed.filter(
            (c) => !c.id?.startsWith('opm-') && !c.description?.includes('MEmuPlay')
          );
          return sortCodesByNewest(cleanCodes);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return sortCodesByNewest(INITIAL_CODES);
  });

  // Function to refresh codes from server and localStorage
  const refreshCodes = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER_CODES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanCodes = parsed.filter(
            (c) => !c.id?.startsWith('opm-') && !c.description?.includes('MEmuPlay')
          );
          setCodes(sortCodesByNewest(cleanCodes));
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchServerCodes().then((serverCodes) => {
      if (serverCodes && serverCodes.length > 0) {
        const cleanCodes = serverCodes.filter(
          (c) => !c.id?.startsWith('opm-') && !c.description?.includes('MEmuPlay')
        );
        const sorted = sortCodesByNewest(cleanCodes);
        setCodes(sorted);
        localStorage.setItem(STORAGE_KEY_USER_CODES, JSON.stringify(sorted));
      }
    });
  }, []);

  // Sync on mount and when returning to home route
  useEffect(() => {
    refreshCodes();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_USER_CODES) {
        refreshCodes();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshCodes, currentRoute]);

  // Redeemed Codes IDs (persisted locally per player)
  const [redeemedCodeIds, setRedeemedCodeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('opm_redeemed_ids');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Sound Effect Toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('opm_sound_enabled') !== 'false';
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ACTIVE');

  // Live Toast for feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist user state locally
  useEffect(() => {
    localStorage.setItem('opm_redeemed_ids', JSON.stringify(redeemedCodeIds));
  }, [redeemedCodeIds]);

  useEffect(() => {
    localStorage.setItem('opm_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  // Toggle Redeemed State
  const handleToggleRedeemed = useCallback((id: string) => {
    setRedeemedCodeIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((item) => item !== id);
      } else {
        if (soundEnabled) playRewardChime();
        return [...prev, id];
      }
    });
  }, [soundEnabled]);

  // Copy single code
  const handleCopyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    if (soundEnabled) playPunchSound();
    setToastMessage(lang === 'en' ? `Copied ${codeStr} successfully!` : `คัดลอก ${codeStr} เรียบร้อยแล้ว!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Filtered & Sorted Codes:
  const filteredCodes = useMemo(() => {
    const list = codes.filter((item) => {
      // TAB 1: เมนูโค้ดล่าสุด -> โชว์เฉพาะโค้ดที่ยังใช้งานได้และเพิ่มมาไม่เกิน 7 วัน
      if (activeTab === 'latest') {
        if (item.status !== 'ACTIVE') return false;
        if (!isCodeLatest(item)) return false;
      }

      // TAB 2: เมนูโค้ดทั้งหมด
      if (activeTab === 'all' && statusFilter !== 'ALL' && item.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      return true;
    });

    return sortCodesByNewest(list);
  }, [codes, activeTab, statusFilter, searchQuery]);

  const activeCodesCount = codes.filter((c) => c.status === 'ACTIVE').length;
  const latestCodesCount = codes.filter((c) => c.status === 'ACTIVE' && isCodeLatest(c)).length;

  // Page sliding animation variants
  const pageSlideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 55 : direction < 0 ? -55 : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 360, damping: 32, mass: 0.8 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -55 : direction < 0 ? 55 : 0,
      opacity: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 360, damping: 32, mass: 0.8 },
        opacity: { duration: 0.15 },
      },
    }),
  };

  // Render Dedicated Admin Portal when on /admin route
  if (currentRoute === 'admin') {
    return <AdminPortal onNavigateHome={() => navigateTo('home')} />;
  }

  const activeTabIndex = Math.max(0, TAB_ORDER.indexOf(activeTab));

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-['Kanit','Plus_Jakarta_Sans',sans-serif] pb-24 md:pb-12 antialiased selection:bg-[#29e6b2] selection:text-black">
      {/* Header Navigation with TH/EN Switcher */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        lang={lang}
        onSelectLang={handleSelectLang}
        activeCount={latestCodesCount}
        onNavigateAdmin={() => navigateTo('admin')}
      />

      {/* Main Content Area with Smooth Slide Transitions */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={slideDirection}>
          {/* VIEW 1: โค้ดล่าสุด */}
          {activeTab === 'latest' && (
            <motion.div
              key="tab-latest"
              custom={slideDirection}
              variants={pageSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="will-change-transform"
            >
              {/* Hero Section */}
              <HeroBanner
                codes={codes}
                lang={lang}
              />

              {/* Section Header */}
              <div className="flex items-center justify-between mb-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-[#29e6b2]" />
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    {t.latestWorkingHeader} <span className="text-[#29e6b2]">({filteredCodes.length})</span>
                  </h2>
                  <span className="text-[11px] text-white/40 hidden sm:inline">{t.latestWorkingSub}</span>
                </div>
                <div>
                  <button
                    onClick={() => handleSelectTab('all')}
                    className="text-xs text-[#29e6b2] hover:underline font-semibold cursor-pointer hidden xs:inline"
                  >
                    {t.viewAllLink} ({codes.length}) →
                  </button>
                </div>
              </div>

              {/* Cards Grid or Empty State */}
              {filteredCodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-6">
                  {filteredCodes.map((code) => (
                    <CodeCard
                      key={code.id}
                      code={code}
                      isRedeemed={redeemedCodeIds.includes(code.id)}
                      canEdit={false}
                      lang={lang}
                      onToggleRedeemed={handleToggleRedeemed}
                      onCopy={handleCopyCode}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 px-6 rounded-3xl border border-white/[0.08] bg-[#0c0d0e]/60 backdrop-blur-md mb-8">
                  <div className="size-14 mx-auto mb-3.5 rounded-2xl bg-[#29e6b2]/10 border border-[#29e6b2]/25 flex items-center justify-center text-[#29e6b2]">
                    <Sparkles className="size-7" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                    {t.noNewCodes7Days}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto mb-4 leading-relaxed">
                    {t.noNewCodes7DaysDesc}
                  </p>
                  <button
                    onClick={() => handleSelectTab('all')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#29e6b2] text-black text-xs font-bold shadow-[0_0_16px_rgba(41,230,178,0.3)] hover:bg-[#34f0bd] active:scale-95 transition-all cursor-pointer"
                  >
                    {t.viewAllCodesBtn} ({activeCodesCount} {t.codesCountSuffix}) →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW 2: โค้ดทั้งหมด (Clean Public Directory) */}
          {activeTab === 'all' && (
            <motion.div
              key="tab-all"
              custom={slideDirection}
              variants={pageSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="pt-28 sm:pt-28 will-change-transform"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#29e6b2] mb-2">
                  <LayoutGrid className="size-3.5" />
                  <span>// FULL CODE DIRECTORY · SEA SERVER ONLY</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white">
                  {t.allCodesHeader} <span className="text-[#29e6b2]">({codes.length} {t.codesCountSuffix})</span>
                </h1>
                <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-lg mx-auto">
                  {t.allCodesSub}
                </p>
              </div>

              {/* Filter & Search Bar */}
              <div className="space-y-3 mb-6">
                {/* Search Box */}
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-[#0c0d0e]/90 border border-white/10 rounded-full pl-11 pr-5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#29e6b2]/60 focus:ring-1 focus:ring-[#29e6b2]/30 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white cursor-pointer"
                    >
                      {t.clearSearch}
                    </button>
                  )}
                </div>

                {/* Status Tabs: ทั้งหมด vs คาดว่ายังใช้งานได้ vs หมดอายุแล้ว */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t.tabAll} ({codes.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-[#29e6b2] text-black shadow-[0_0_16px_rgba(41,230,178,0.3)]'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t.tabActive} ({activeCodesCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('EXPIRED')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === 'EXPIRED'
                        ? 'bg-rose-500/80 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t.tabExpired} ({codes.length - activeCodesCount})
                  </button>
                </div>
              </div>

              {/* Results Count & Quick Batch Copy */}
              <div className="flex items-center justify-between text-xs text-white/50 mb-3 px-1">
                <span>{t.foundItems} {filteredCodes.length} {t.itemsSuffix}</span>
                {activeCodesCount > 0 && (
                  <button
                    onClick={() => setIsBatchCopyModalOpen(true)}
                    className="text-[#29e6b2] hover:underline font-semibold cursor-pointer"
                  >
                    {t.copyAllOneClick}
                  </button>
                )}
              </div>

              {/* Cards Grid */}
              {filteredCodes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-6">
                  {filteredCodes.map((code) => (
                    <CodeCard
                      key={code.id}
                      code={code}
                      isRedeemed={redeemedCodeIds.includes(code.id)}
                      canEdit={false}
                      lang={lang}
                      onToggleRedeemed={handleToggleRedeemed}
                      onCopy={handleCopyCode}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 rounded-2xl border border-white/[0.08] bg-[#0c0d0e]/60 backdrop-blur-md mb-8">
                  <p className="text-sm text-white/60">
                    {codes.length === 0 ? t.noCodesInSystem : t.noCodesFound}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW 3: วิธีใส่โค้ดในเกม (Guide พร้อมรูปประกอบขั้นตอน โหลดเร็ว ลื่นไหล ไม่แลค) */}
          {activeTab === 'guide' && (
            <motion.div
              key="tab-guide"
              custom={slideDirection}
              variants={pageSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="pt-28 sm:pt-28 max-w-3xl mx-auto will-change-transform"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#29e6b2] mb-2">
                  <BookOpen className="size-3.5" />
                  <span>{t.guideTag}</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white">
                  {t.guideHeader}
                </h1>
                <p className="text-xs sm:text-sm text-white/60 mt-1">
                  {t.guideSub}
                </p>
              </div>

              <div className="max-w-3xl mx-auto mb-8">
                {/* Steps List */}
                <div className="space-y-4">
                  {[
                    {
                      step: '01',
                      title: t.step1Title,
                      desc: t.step1Desc,
                    },
                    {
                      step: '02',
                      title: t.step2Title,
                      desc: t.step2Desc,
                      image: 'https://img2.pic.in.th/1000125847.png',
                    },
                    {
                      step: '03',
                      title: t.step3Title,
                      desc: t.step3Desc,
                      image: 'https://img1.pic.in.th/images/1000126037.png',
                    },
                    {
                      step: '04',
                      title: t.step4Title,
                      desc: t.step4Desc,
                      image: 'https://img2.pic.in.th/1000126041.png',
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="p-5 rounded-2xl bg-[#0c0d0e]/80 border border-white/[0.08] transition-all hover:border-white/20"
                    >
                      <div className="flex items-start gap-4">
                        <div className="size-9 rounded-xl bg-[#29e6b2]/10 border border-[#29e6b2]/30 flex items-center justify-center font-mono font-bold text-xs sm:text-sm text-[#29e6b2] flex-shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-white mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {/* Step Image illustration with async decoding, preloaded cache, and zero-shift loader */}
                      {item.image && (
                        <GuideStepImage
                          src={item.image}
                          alt={`รูปประกอบขั้นตอนที่ ${item.step}: ${item.title}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-[#0c0d0e]/40 border border-white/[0.06] text-xs text-white/40 text-center mt-4">
                  {t.guideNote}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Toast */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/95 text-white border border-[#29e6b2]/40 shadow-[0_12px_32px_rgba(0,0,0,0.8),0_0_20px_rgba(41,230,178,0.3)] text-xs font-semibold backdrop-blur-xl"
          >
            <Sparkles className="size-3.5 text-[#29e6b2]" />
            <span>{toastMessage}</span>
          </motion.div>
        </div>
      )}

      {/* Mobile Floating Bottom Bar with Direct Sliding Indicator (Never jumps from outside) */}
      <nav
        aria-label="เมนูหลักบนมือถือ"
        className="md:hidden fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 max-w-md mx-auto z-40 bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.9)]"
      >
        <div className="relative grid grid-cols-3 items-stretch gap-1">
          {/* Direct sliding background box - always smooth and stays strictly in bounds */}
          <motion.div
            className="absolute inset-y-0 rounded-xl bg-[#242629] border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] pointer-events-none"
            initial={false}
            animate={{
              left: `${activeTabIndex * 33.333}%`,
              width: '33.333%',
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 32,
              mass: 0.8,
            }}
          />

          {[
            { id: 'latest' as MainMenuTab, label: t.latestMenu, icon: Flame },
            { id: 'all' as MainMenuTab, label: t.allMenu, icon: LayoutGrid },
            { id: 'guide' as MainMenuTab, label: t.guideMenu, icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className="relative z-10 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[50px] select-none"
              >
                {/* Icon size 20px, crisp white stroke when active */}
                <Icon
                  className={`size-5 mb-0.5 relative z-10 transition-colors ${
                    isActive ? 'text-white stroke-[2.2]' : 'text-[#8e939a] stroke-[1.8]'
                  }`}
                />
                {/* Text 10.5px */}
                <span
                  className={`text-[10.5px] tracking-tight relative z-10 transition-colors ${
                    isActive ? 'text-white font-medium' : 'text-[#8e939a]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Batch Copy Modal for players */}
      <BatchCopyModal
        isOpen={isBatchCopyModalOpen}
        onClose={() => setIsBatchCopyModalOpen(false)}
        codes={codes}
        lang={lang}
        onCopySuccess={() => {
          if (soundEnabled) playPunchSound();
          setToastMessage(t.batchCopySuccessToast);
          setTimeout(() => setToastMessage(null), 2500);
        }}
      />
    </div>
  );
}
