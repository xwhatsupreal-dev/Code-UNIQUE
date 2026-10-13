import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, Check, Bell, BookOpen, Copy, LayoutGrid, Flame, Volume2, Send, AlertCircle, RotateCw, Plus, Trash2, ShieldCheck, Lock, Edit3 } from 'lucide-react';
import { RedeemCode, NotificationSettings } from './types/code';
import { AUTHORIZED_ADMIN_EMAIL } from './types/auth';
import { INITIAL_CODES } from './data/initialCodes';
import { Navbar, MainMenuTab } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CodeCard } from './components/CodeCard';
import { BatchCopyModal } from './components/BatchCopyModal';
import { AddCodeModal } from './components/AddCodeModal';
import { EditCodeModal } from './components/EditCodeModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { playPunchSound, playRewardChime, playAlertSound } from './utils/audio';
import { getNotificationPermission, requestNotificationPermission, sendWebNotification, NotificationPermissionState } from './utils/notifications';
import { sortCodesByNewest } from './services/codeSyncService';
import {
  fetchServerCodes,
  saveServerCode,
  saveServerBatchCodes,
  updateServerCode,
  deleteServerCode,
  clearServerCodes,
  fetchCloudflareStatus,
} from './services/codeApiService';
import { CloudflareModal } from './components/CloudflareModal';
import { AdminPortal } from './components/AdminPortal';

// Storage key specifically for user-managed custom codes
const STORAGE_KEY_USER_CODES = 'opm_user_managed_codes_v1';

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

  // 4 Main Menus State: 'latest' | 'all' | 'notifications' | 'guide'
  const [activeTab, setActiveTab] = useState<MainMenuTab>('latest');

  // Admin Auth State: default to teerasit.thanwa@gmail.com
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('opm_admin_user_email') || AUTHORIZED_ADMIN_EMAIL;
  });
  const [isGuestPreview, setIsGuestPreview] = useState<boolean>(() => {
    return localStorage.getItem('opm_admin_guest_preview') === 'true';
  });

  const isAdmin = useMemo(() => {
    return !isGuestPreview && (currentUserEmail || '').toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
  }, [currentUserEmail, isGuestPreview]);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<RedeemCode | null>(null);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isBatchCopyModalOpen, setIsBatchCopyModalOpen] = useState(false);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isCloudflareConnected, setIsCloudflareConnected] = useState(false);

  // Codes State: starts clean for user teerasit.thanwa@gmail.com to add manually
  // Filter out any legacy codes that originated from external websites
  const [codes, setCodes] = useState<RedeemCode[]>(() => {
    // Clear legacy external caches
    try {
      localStorage.removeItem('opm_codes_sea_v2');
      localStorage.removeItem('opm_last_sync_timestamp');
      localStorage.removeItem('opm_source_last_modified');
    } catch {}

    const saved = localStorage.getItem(STORAGE_KEY_USER_CODES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude codes imported from other websites
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

  // Redeemed Codes IDs (persisted locally)
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

  // Push Notification State
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>(getNotificationPermission());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('opm_notif_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      enabled: false,
      soundEnabled: true,
      onlyGems: false,
      onlyTickets: false,
      minGemsThreshold: 500,
    };
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ACTIVE');

  // Live Toast for feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('ล่าสุด');

  // In-Game Guide Simulator Input
  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulatorResult, setSimulatorResult] = useState<{ success: boolean; message: string } | null>(null);

  // Notification testing state
  const [testSent, setTestSent] = useState(false);

  // Fetch initial codes from server (for cross-user persistence)
  useEffect(() => {
    fetchServerCodes().then((serverCodes) => {
      if (serverCodes && serverCodes.length > 0) {
        const cleanCodes = serverCodes.filter(
          (c) => !c.id?.startsWith('opm-') && !c.description?.includes('MEmuPlay')
        );
        setCodes(sortCodesByNewest(cleanCodes));
      }
    });

    // Check Cloudflare connection status
    fetchCloudflareStatus().then((cf) => {
      if (cf?.isConnected) {
        setIsCloudflareConnected(true);
      }
    });

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || params.get('admin') === 'true') {
        setIsAdminAuthOpen(true);
      }
    } catch {
      // ignore in SSR or iframe if restricted
    }
  }, []);

  // Save codes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER_CODES, JSON.stringify(codes));
  }, [codes]);

  // Persist admin auth status
  useEffect(() => {
    if (currentUserEmail) {
      localStorage.setItem('opm_admin_user_email', currentUserEmail);
    } else {
      localStorage.removeItem('opm_admin_user_email');
    }
  }, [currentUserEmail]);

  useEffect(() => {
    localStorage.setItem('opm_admin_guest_preview', String(isGuestPreview));
  }, [isGuestPreview]);

  useEffect(() => {
    localStorage.setItem('opm_redeemed_ids', JSON.stringify(redeemedCodeIds));
  }, [redeemedCodeIds]);

  useEffect(() => {
    localStorage.setItem('opm_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('opm_notif_settings', JSON.stringify(notifSettings));
  }, [notifSettings]);

  /**
   * Admin Auth Handlers
   */
  const handleLoginAsAdmin = useCallback((email: string) => {
    setCurrentUserEmail(email);
    setIsGuestPreview(false);
    setToastMessage(`👑 ยินดีต้อนรับแอดมิน (${email}) มีสิทธิ์เพิ่มและแก้ไขโค้ด`);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleSwitchToGuest = useCallback(() => {
    setIsGuestPreview(true);
    setToastMessage('👁️ สลับไปยังโหมดผู้ชมทั่วไป (อ่านอย่างเดียว)');
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  /**
   * Add a new single code (user added)
   * Places at the very top automatically
   */
  const handleAddCode = useCallback((codeData: Omit<RedeemCode, 'id'>) => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }

    const newCode: RedeemCode = {
      ...codeData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAtTimestamp: Date.now(),
    };

    setCodes((prev) => {
      const filtered = prev.filter((c) => c.code.toUpperCase() !== newCode.code.toUpperCase());
      return sortCodesByNewest([newCode, ...filtered]);
    });

    saveServerCode(newCode, currentUserEmail);

    if (soundEnabled) {
      playAlertSound();
    }

    setToastMessage(`🎉 เพิ่มโค้ด ${newCode.code} เรียบร้อยแล้ว! (จัดไว้บนสุด)`);
    setTimeout(() => setToastMessage(null), 3000);
  }, [isAdmin, currentUserEmail, soundEnabled]);

  /**
   * Batch Add Multiple Codes (user pasted)
   * Places at the very top automatically
   */
  const handleBatchAddCodes = useCallback((newCodesData: Array<Omit<RedeemCode, 'id'>>) => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }

    const formatted: RedeemCode[] = newCodesData.map((data, idx) => ({
      ...data,
      id: `user-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      addedAtTimestamp: Date.now() + (newCodesData.length - idx),
    }));

    setCodes((prev) => {
      const incomingCodeSet = new Set(formatted.map((c) => c.code.toUpperCase()));
      const filtered = prev.filter((c) => !incomingCodeSet.has(c.code.toUpperCase()));
      return sortCodesByNewest([...formatted, ...filtered]);
    });

    saveServerBatchCodes(formatted, currentUserEmail);

    if (soundEnabled) {
      playAlertSound();
    }

    setToastMessage(`🎉 เพิ่มโค้ดใหม่ ${formatted.length} รายการสำเร็จแล้ว! (จัดไว้บนสุด)`);
    setTimeout(() => setToastMessage(null), 3000);
  }, [isAdmin, currentUserEmail, soundEnabled]);

  /**
   * Save Edited Code
   */
  const handleSaveEditedCode = useCallback((updatedCode: RedeemCode) => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }

    setCodes((prev) => prev.map((c) => (c.id === updatedCode.id ? updatedCode : c)));
    updateServerCode(updatedCode, currentUserEmail);

    setToastMessage(`✏️ แก้ไขโค้ด ${updatedCode.code} เรียบร้อยแล้ว`);
    setTimeout(() => setToastMessage(null), 2500);
  }, [isAdmin, currentUserEmail]);

  /**
   * Delete a code
   */
  const handleDeleteCode = useCallback((id: string) => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }

    setCodes((prev) => prev.filter((c) => c.id !== id));
    deleteServerCode(id, currentUserEmail);

    setToastMessage('🗑️ ลบโค้ดเรียบร้อยแล้ว');
    setTimeout(() => setToastMessage(null), 2000);
  }, [isAdmin, currentUserEmail]);

  /**
   * Toggle code status between ACTIVE and EXPIRED
   */
  const handleToggleCodeStatus = useCallback((id: string) => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }

    let modifiedCode: RedeemCode | null = null;
    setCodes((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
          modifiedCode = {
            ...c,
            status: newStatus,
            verifiedWorking: newStatus === 'ACTIVE',
          };
          return modifiedCode;
        }
        return c;
      })
    );

    if (modifiedCode) {
      updateServerCode(modifiedCode, currentUserEmail);
    }

    setToastMessage('🔄 เปลี่ยนสถานะโค้ดเรียบร้อยแล้ว');
    setTimeout(() => setToastMessage(null), 2000);
  }, [isAdmin, currentUserEmail]);

  /**
   * Clear all codes (Reset to empty)
   */
  const handleClearAllCodes = useCallback(() => {
    if (!isAdmin) {
      setIsAdminAuthOpen(true);
      return;
    }

    if (window.confirm('คุณต้องการลบโค้ดทั้งหมดในระบบใช่หรือไม่?')) {
      setCodes([]);
      clearServerCodes(currentUserEmail);
      setToastMessage('🗑️ ลบโค้ดทั้งหมดเรียบร้อยแล้ว');
      setTimeout(() => setToastMessage(null), 2000);
    }
  }, [isAdmin, currentUserEmail]);

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
    setToastMessage(`คัดลอก ${codeStr} เรียบร้อยแล้ว!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };



  // Permission Request
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setNotifSettings((s) => ({ ...s, enabled: true }));
      sendWebNotification('OPM The Strongest', {
        body: 'เปิดระบบแจ้งเตือนโค้ดใหม่เรียบร้อยแล้ว',
      });
      setToastMessage('เปิดการแจ้งเตือนเรียบร้อยแล้ว!');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Test Notification
  const handleSendTestNotification = () => {
    if (notifPermission !== 'granted') {
      handleRequestPermission();
      return;
    }
    if (soundEnabled) playAlertSound();
    sendWebNotification('OPM The Strongest', {
      body: 'ระบบแจ้งเตือนทำงานได้ตามปกติ คุณจะได้รับแจ้งเมื่อมีโค้ดใหม่',
    });
    setTestSent(true);
    setToastMessage('ส่งการแจ้งเตือนทดสอบแล้ว!');
    setTimeout(() => {
      setTestSent(false);
      setToastMessage(null);
    }, 3000);
  };

  // Simulate Live Drop
  const handleSimulateLiveDrop = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const dropCode: RedeemCode = {
        id: `sim-${Date.now()}`,
        code: `SAITAMA${Math.floor(1000 + Math.random() * 9000)}`,
        server: 'SEA',
        status: 'ACTIVE',
        rewards: [],
        description: 'โค้ดทดสอบระบบ (ระบบจำลองสด)',
        addedAt: 'ล่าสุด',
        addedAtTimestamp: Date.now(),
        expiresAt: '???',
        verifiedWorking: true,
        workingVotes: 12,
        expiredVotes: 0,
        isNew: true,
        isHot: true,
      };

      setCodes((prev) => sortCodesByNewest([dropCode, ...prev]));

      if (soundEnabled) playAlertSound();

      sendWebNotification(`OPM The Strongest: โค้ดใหม่ ${dropCode.code}`, {
        body: 'โค้ดของขวัญเซิร์ฟเวอร์ SEA ใหม่พร้อมใช้งานแล้ว',
      });

      setToastMessage(`💥 มีโค้ดใหม่เข้ามา: ${dropCode.code} (จัดขึ้นบนสุดแล้ว)`);
      setTimeout(() => setToastMessage(null), 3500);

      setIsSimulating(false);
    }, 600);
  };

  // Guide Simulator Handler
  const handleSimulateRedeem = () => {
    const clean = simulatorInput.trim().toUpperCase();
    if (!clean) {
      setSimulatorResult({ success: false, message: 'กรุณากรอกรหัส Redeem Code' });
      return;
    }

    const matchedCode = codes.find((c) => c.code.toUpperCase() === clean);
    if (matchedCode && matchedCode.status === 'ACTIVE') {
      if (soundEnabled) playRewardChime();
      setSimulatorResult({
        success: true,
        message: `🎉 แลกรับโค้ด ${matchedCode.code} สำเร็จ! ระบบจัดส่งของรางวัลไปยังกล่องจดหมายในเกมแล้ว`,
      });
    } else if (matchedCode && matchedCode.status === 'EXPIRED') {
      setSimulatorResult({
        success: false,
        message: `⚠️ โค้ด ${matchedCode.code} หมดอายุแล้ว กรุณาเลือกใช้โค้ดล่าสุดจากรายการ`,
      });
    } else {
      setSimulatorResult({
        success: false,
        message: '⚠️ รหัสไม่ถูกต้องหรือไม่มีในเซิร์ฟเวอร์ SEA กรุณาตรวจสอบตัวสะกดอีกครั้ง',
      });
    }
  };

  // Filtered & Sorted Codes:
  // Codes that arrived latest are ALWAYS sorted at the very top automatically
  const filteredCodes = useMemo(() => {
    const list = codes.filter((item) => {
      if (activeTab === 'latest' && item.status !== 'ACTIVE') return false;
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

  // Render Dedicated Admin Portal when on /admin route
  if (currentRoute === 'admin') {
    return <AdminPortal onNavigateHome={() => navigateTo('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-['Kanit','Plus_Jakarta_Sans',sans-serif] pb-24 md:pb-12 antialiased selection:bg-[#29e6b2] selection:text-black">
      {/* SwitchHub Floating Glass Header (Smooth Desktop Nav) */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        notifPermission={notifPermission}
        onRequestPermission={handleRequestPermission}
        activeCount={activeCodesCount}
        onAddNewCode={isAdmin ? () => setIsAddModalOpen(true) : undefined}
        isAdmin={isAdmin}
        currentUserEmail={currentUserEmail}
        onOpenAuthModal={() => setIsAdminAuthOpen(true)}
        onOpenCloudflareModal={isAdmin ? () => setIsCloudflareModalOpen(true) : undefined}
        onNavigateAdmin={() => navigateTo('admin')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6">
        {/* VIEW 1: โค้ด (ล่าสุด) */}
        {activeTab === 'latest' && (
          <section className="animate-in fade-in duration-200">
            {/* Hero Section styled after SwitchHub */}
            <HeroBanner
              codes={codes}
              onBatchCopy={() => setIsBatchCopyModalOpen(true)}
              onSimulateLiveDrop={handleSimulateLiveDrop}
              isSimulating={isSimulating}
              lastUpdated={lastUpdated}
              onAddNewCode={isAdmin ? () => setIsAddModalOpen(true) : undefined}
              isAdmin={isAdmin}
              onOpenAuthModal={() => setIsAdminAuthOpen(true)}
              onOpenCloudflareModal={isAdmin ? () => setIsCloudflareModalOpen(true) : undefined}
              isCloudflareConnected={isCloudflareConnected}
            />

            {/* Section Header */}
            <div className="flex items-center justify-between mb-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-[#29e6b2]" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  โค้ดล่าสุดที่ใช้งานได้ <span className="text-[#29e6b2]">({filteredCodes.length})</span>
                </h2>
                <span className="text-[11px] text-white/40 hidden sm:inline">· เรียงตามที่มาใหม่อัตโนมัติ</span>
              </div>
              <div>
                <button
                  onClick={() => setActiveTab('all')}
                  className="text-xs text-[#29e6b2] hover:underline font-semibold cursor-pointer hidden xs:inline"
                >
                  ดูทั้งหมด ({codes.length}) →
                </button>
              </div>
            </div>

            {/* Cards Grid or Empty State */}
            {filteredCodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-8">
                {filteredCodes.map((code) => (
                  <CodeCard
                    key={code.id}
                    code={code}
                    isRedeemed={redeemedCodeIds.includes(code.id)}
                    canEdit={false}
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
                  ยังไม่มีโค้ดในระบบ
                </h3>
                <p className="text-xs sm:text-sm text-white/50 max-w-md mx-auto mb-2 leading-relaxed">
                  ขณะนี้ยังไม่มีโค้ดใหม่ในระบบ กรุณารอแอดมินอัปเดตโค้ดใหม่ล่าสุดให้เร็วๆ นี้
                </p>
              </div>
            )}
          </section>
        )}

        {/* VIEW 2: โค้ดทั้งหมด */}
        {activeTab === 'all' && (
          <section className="pt-28 sm:pt-28 animate-in fade-in duration-200">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#29e6b2] mb-2">
                <LayoutGrid className="size-3.5" />
                <span>// FULL CODE DIRECTORY · SEA SERVER ONLY</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                รายการโค้ดทั้งหมด <span className="text-[#29e6b2]">({codes.length} รายการ)</span>
              </h1>
              <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-lg mx-auto">
                {isAdmin
                  ? `โหมดผู้ดูแลระบบ (${AUTHORIZED_ADMIN_EMAIL}): คุณสามารถเพิ่ม แก้ไข สลับสถานะ หรือลบโค้ดได้อย่างอิสระ`
                  : 'ค้นหาและคัดลอกโค้ดเกม ONE PUNCH MAN สำหรับเซิร์ฟเวอร์ SEA'}
              </p>

              {/* Action Buttons in header - ONLY shown to admin */}
              {isAdmin && (
                <div className="flex items-center justify-center gap-2 mt-3.5">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#29e6b2] text-black text-xs font-bold shadow-[0_0_16px_rgba(41,230,178,0.3)] hover:bg-[#34f0bd] active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>+ เพิ่มโค้ดใหม่ (แอดมิน)</span>
                  </button>

                  {codes.length > 0 && (
                    <button
                      onClick={handleClearAllCodes}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-medium transition-all cursor-pointer"
                      title="ลบโค้ดทั้งหมดในระบบ (เฉพาะแอดมิน)"
                    >
                      <Trash2 className="size-3" />
                      <span>ลบทั้งหมด</span>
                    </button>
                  )}
                </div>
              )}
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
                  placeholder="ค้นหาโค้ดที่ต้องการ..."
                  className="w-full bg-[#0c0d0e]/90 border border-white/10 rounded-full pl-11 pr-5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#29e6b2]/60 focus:ring-1 focus:ring-[#29e6b2]/30 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white cursor-pointer"
                  >
                    ล้าง
                  </button>
                )}
              </div>

              {/* Status Tabs: ทั้งหมด vs ใช้งานได้ vs หมดอายุแล้ว */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'ALL'
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  ทั้งหมด ({codes.length})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-[#29e6b2] text-black shadow-[0_0_16px_rgba(41,230,178,0.3)]'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  กำลังใช้งานได้ ({activeCodesCount})
                </button>
                <button
                  onClick={() => setStatusFilter('EXPIRED')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'EXPIRED'
                      ? 'bg-red-500/80 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  หมดอายุแล้ว ({codes.length - activeCodesCount})
                </button>
              </div>
            </div>

            {/* Results Count & Quick Batch Copy */}
            <div className="flex items-center justify-between text-xs text-white/50 mb-3 px-1">
              <span>พบ {filteredCodes.length} รายการ (เรียงตามที่มาใหม่อัตโนมัติ)</span>
              {activeCodesCount > 0 && (
                <button
                  onClick={() => setIsBatchCopyModalOpen(true)}
                  className="text-[#29e6b2] hover:underline font-semibold cursor-pointer"
                >
                  คัดลอกโค้ดที่ใช้งานได้ทั้งหมดใน 1 คลิก
                </button>
              )}
            </div>

            {/* Cards Grid */}
            {filteredCodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-8">
                {filteredCodes.map((code) => (
                  <CodeCard
                    key={code.id}
                    code={code}
                    isRedeemed={redeemedCodeIds.includes(code.id)}
                    canEdit={false}
                    onToggleRedeemed={handleToggleRedeemed}
                    onCopy={handleCopyCode}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 rounded-2xl border border-white/[0.08] bg-[#0c0d0e]/60 backdrop-blur-md mb-8">
                <p className="text-sm text-white/60">
                  {codes.length === 0 ? 'ยังไม่มีโค้ดในระบบ' : 'ไม่พบโค้ดที่ตรงกับการค้นหา'}
                </p>
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: การแจ้งเตือน (Notifications) */}
        {activeTab === 'notifications' && (
          <section className="pt-28 sm:pt-28 animate-in fade-in duration-200 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#29e6b2] mb-2">
                <Bell className="size-3.5" />
                <span>// REAL-TIME PUSH ALERTS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                ระบบแจ้งเตือนโค้ดใหม่
              </h1>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                ไม่พลาดโค้ดใหม่แม้ปิดหน้าเว็บ รับแจ้งเตือนผ่าน Browser ทันทีที่มีการเพิ่มโค้ด
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-[#0c0d0e]/90 backdrop-blur-xl space-y-6 shadow-2xl mb-8">
              {/* Permission Status Card */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/60 border border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${
                    notifPermission === 'granted'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-white/40 border border-white/10'
                  }`}>
                    <Bell className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      สถานะสิทธิ์การแจ้งเตือน
                    </h3>
                    <p className="text-xs text-white/50">
                      {notifPermission === 'granted'
                        ? 'อนุญาตแล้ว · ระบบพร้อมส่งแจ้งเตือนแบบพุช'
                        : notifPermission === 'denied'
                        ? 'ถูกปิดกั้น · กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์'
                        : 'ยังไม่ได้เปิดใช้งาน'}
                    </p>
                  </div>
                </div>

                {notifPermission !== 'granted' && (
                  <button
                    onClick={handleRequestPermission}
                    className="px-4 py-2 rounded-full bg-[#29e6b2] text-black text-xs font-bold hover:bg-[#34f0bd] active:scale-95 transition-all shadow-[0_0_16px_rgba(41,230,178,0.35)] cursor-pointer"
                  >
                    เปิดแจ้งเตือน
                  </button>
                )}
              </div>

              {/* Push Notification Switch & Controls */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  การตั้งค่าการแจ้งเตือนในเว็บ
                </h4>

                {/* Main Notification Master Switch */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#29e6b2]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-xl flex items-center justify-center ${
                      notifSettings.enabled
                        ? 'bg-[#29e6b2]/10 text-[#29e6b2] border border-[#29e6b2]/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}>
                      <Bell className="size-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>รับการแจ้งเตือนโค้ดใหม่</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          notifSettings.enabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/10 text-white/40'
                        }`}>
                          {notifSettings.enabled ? 'เปิดอยู่' : 'ปิดอยู่'}
                        </span>
                      </div>
                      <div className="text-xs text-white/45 mt-0.5">
                        แจ้งเตือนบนหน้าจอทันทีเมื่อแอดมินเพิ่มโค้ดใหม่เข้าสู่ระบบ
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!notifSettings.enabled) {
                        // Turning ON
                        if (notifPermission !== 'granted') {
                          await handleRequestPermission();
                        } else {
                          setNotifSettings((s) => ({ ...s, enabled: true }));
                          setToastMessage('เปิดการแจ้งเตือนโค้ดใหม่แล้ว!');
                          setTimeout(() => setToastMessage(null), 2500);
                        }
                      } else {
                        // Turning OFF
                        setNotifSettings((s) => ({ ...s, enabled: false }));
                        setToastMessage('ปิดการแจ้งเตือนเรียบร้อย');
                        setTimeout(() => setToastMessage(null), 2500);
                      }
                    }}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifSettings.enabled ? 'bg-[#29e6b2]' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block size-6 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound Effect Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="size-4 text-[#29e6b2]" />
                    <div>
                      <div className="text-xs font-bold text-white">เสียงเอฟเฟกต์ (Punch Audio)</div>
                      <div className="text-[11px] text-white/40">เล่นเสียงหมัดไซตามะเมื่อคัดลอกหรือรับโค้ด</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="size-4 rounded accent-[#29e6b2] cursor-pointer"
                  />
                </div>
              </div>

              {/* Test Action */}
              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-xs text-white/40">ทดสอบระบบแจ้งเตือน</span>
                <button
                  onClick={handleSendTestNotification}
                  disabled={testSent}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                  <span>{testSent ? 'ส่งเรียบร้อย!' : 'ทดสอบส่งการแจ้งเตือน'}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 4: วิธีใส่โค้ดในเกม (Guide & Simulator) */}
        {activeTab === 'guide' && (
          <section className="pt-28 sm:pt-28 animate-in fade-in duration-200 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#29e6b2] mb-2">
                <BookOpen className="size-3.5" />
                <span>// STEP-BY-STEP REDEEM INSTRUCTIONS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                วิธีใส่โค้ด OPM The Strongest
              </h1>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                คู่มือการแลกโค้ดของขวัญในเกมทีละขั้นตอน
              </p>
            </div>

            <div className="max-w-3xl mx-auto mb-8">
              {/* Steps List */}
              <div className="space-y-3">
                {[
                  {
                    step: '01',
                    title: 'เปิดเกมและไปที่หน้าหลัก',
                    desc: 'เข้าสู่เกม ONE PUNCH MAN: The Strongest (เซิร์ฟเวอร์ SEA)',
                  },
                  {
                    step: '02',
                    title: 'กดที่รูปโปรไฟล์ตัวละคร',
                    desc: 'แตะที่รูปโปรไฟล์ที่มุมบนซ้ายของหน้าจอหลักในเกม',
                  },
                  {
                    step: '03',
                    title: 'เลือกเมนู "Gift Code" (รหัสของขวัญ)',
                    desc: 'กดที่ปุ่ม "Gift Code" หรือ "รหัสแลกเปลี่ยน" ในหน้าข้อมูลผู้เล่น',
                  },
                  {
                    step: '04',
                    title: 'วางโค้ดแล้วกดยืนยัน',
                    desc: 'นำโค้ดที่คัดลอกจากหน้านี้ไปวาง แล้วกดยืนยันเพื่อรับของรางวัลในกล่องจดหมาย',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-[#0c0d0e]/80 border border-white/[0.08]"
                  >
                    <div className="size-9 rounded-xl bg-[#29e6b2]/10 border border-[#29e6b2]/30 flex items-center justify-center font-mono font-bold text-xs sm:text-sm text-[#29e6b2] flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#0c0d0e]/40 border border-white/[0.06] text-xs text-white/40 text-center mt-4">
                หมายเหตุ: โค้ดแต่ละโค้ดสามารถแลกรับของรางวัลได้ 1 ครั้งต่อ 1 บัญชีเกมเท่านั้น
              </div>
            </div>
          </section>
        )}
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

      {/* Mobile Floating Bottom Bar with 4 Menus - Compact & Sleek */}
      <nav
        aria-label="เมนูหลักบนมือถือ"
        className="md:hidden fixed bottom-3 left-4 right-4 z-40 bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.9)]"
      >
        <div className="relative grid grid-cols-4 items-stretch gap-1">
          {[
            { id: 'latest' as MainMenuTab, label: 'โค้ดล่าสุด', icon: Flame },
            { id: 'all' as MainMenuTab, label: 'โค้ดทั้งหมด', icon: LayoutGrid },
            { id: 'notifications' as MainMenuTab, label: 'แจ้งเตือน', icon: Bell },
            { id: 'guide' as MainMenuTab, label: 'วิธีใส่โค้ด', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="relative z-10 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[50px] select-none"
              >
                {/* Active Rounded Box: Smooth fluid spring sliding indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobileBottomIndicator"
                    className="absolute inset-0 rounded-xl bg-[#242629] border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
                    transition={{
                      type: 'spring',
                      stiffness: 340,
                      damping: 27,
                      mass: 0.8,
                    }}
                  />
                )}
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

      {/* Batch Copy Modal */}
      <BatchCopyModal
        isOpen={isBatchCopyModalOpen}
        onClose={() => setIsBatchCopyModalOpen(false)}
        codes={codes}
        onCopySuccess={() => {
          if (soundEnabled) playPunchSound();
          setToastMessage(`คัดลอกโค้ดทั้งหมดเรียบร้อยแล้ว!`);
          setTimeout(() => setToastMessage(null), 2500);
        }}
      />

      {/* Add Code Modal (Single or Batch Paste) */}
      <AddCodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCode={handleAddCode}
        onBatchAddCodes={handleBatchAddCodes}
        isAdmin={isAdmin}
        currentEmail={currentUserEmail}
      />

      {/* Edit Code Modal */}
      <EditCodeModal
        isOpen={!!editingCode}
        onClose={() => setEditingCode(null)}
        code={editingCode}
        onSave={handleSaveEditedCode}
        currentEmail={currentUserEmail}
      />

      {/* Admin Auth Modal (teerasit.thanwa@gmail.com permission restriction) */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        currentUserEmail={currentUserEmail}
        isAdmin={isAdmin}
        onLoginAsAdmin={handleLoginAsAdmin}
        onSwitchToGuest={handleSwitchToGuest}
      />

      {/* Cloudflare Edge Storage Modal (Admin Only) */}
      <CloudflareModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        currentUserEmail={currentUserEmail}
        onSyncComplete={() => {
          fetchServerCodes().then((serverCodes) => {
            if (serverCodes && serverCodes.length > 0) {
              setCodes(sortCodesByNewest(serverCodes));
            }
          });
          fetchCloudflareStatus().then((cf) => {
            setIsCloudflareConnected(!!cf?.isConnected);
          });
        }}
      />

      {/* Floating Exit Button for Admin testing Guest Preview */}
      {isGuestPreview && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-50">
          <button
            onClick={() => {
              setIsGuestPreview(false);
              setToastMessage('👑 สลับกลับสู่โหมดแอดมิน');
              setTimeout(() => setToastMessage(null), 3000);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/95 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500/10 transition-all cursor-pointer"
          >
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>โหมดผู้ชมทั่วไป (คลิกเพื่อกลับสู่โหมดแอดมิน)</span>
          </button>
        </div>
      )}
    </div>
  );
}
