import React from 'react';
import { motion } from 'motion/react';
import { Flame, Package, Bell, BookOpen, Volume2, VolumeX, Plus, ShieldCheck, Lock, Cloud } from 'lucide-react';
import { NotificationPermissionState } from '../utils/notifications';
import { AUTHORIZED_ADMIN_EMAIL } from '../types/auth';

export type MainMenuTab = 'latest' | 'all' | 'notifications' | 'guide';

interface NavbarProps {
  activeTab: MainMenuTab;
  onSelectTab: (tab: MainMenuTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notifPermission: NotificationPermissionState;
  activeCount?: number;
  onRequestPermission?: () => void;
  onAddNewCode?: () => void;
  isAdmin?: boolean;
  currentUserEmail?: string | null;
  onOpenAuthModal?: () => void;
  onOpenCloudflareModal?: () => void;
  onNavigateAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  notifPermission,
  onAddNewCode,
  isAdmin = false,
  currentUserEmail,
  onOpenAuthModal,
  onOpenCloudflareModal,
  onNavigateAdmin,
}) => {
  const menuItems = [
    { id: 'latest' as const, label: 'โค้ด (ล่าสุด)', icon: Flame },
    { id: 'all' as const, label: 'โค้ดทั้งหมด', icon: Package },
    { id: 'notifications' as const, label: 'แจ้งเตือน', icon: Bell },
    { id: 'guide' as const, label: 'วิธีใส่โค้ด', icon: BookOpen },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-5 pt-2.5 sm:pt-3 pointer-events-none">
      <div className="mx-auto max-w-5xl pointer-events-auto">
        {/* Top Floating Glass Bar - Enlarged slightly for better presence and touch comfort */}
        <nav className="nav-shell rounded-2xl px-3.5 sm:px-4.5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 shadow-[0_14px_32px_rgba(0,0,0,0.85)]">
          {/* Brand Logo */}
          <div 
            onClick={() => onSelectTab('latest')}
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
          >
            <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-[#29e6b2] to-[#149974] flex items-center justify-center font-black text-black text-xs sm:text-sm shadow-[0_0_14px_rgba(41,230,178,0.4)] flex-shrink-0 tracking-tight">
              OPM
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] sm:text-base font-black tracking-tight text-white whitespace-nowrap">
                ONE PUNCH <span className="text-[#29e6b2]">HUB</span>
              </span>
              <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#29e6b2]/15 text-[#29e6b2] border border-[#29e6b2]/30 uppercase tracking-wider">
                SEA
              </span>
            </div>
          </div>

          {/* Desktop 4 Main Menus with Rounded Box Frame Indicator matching the aesthetic */}
          <div className="hidden md:flex items-center gap-1 bg-[#141618]/90 border border-white/[0.08] p-1.5 rounded-xl relative shadow-inner">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                    isActive ? 'text-white' : 'text-[#8e939a] hover:text-white'
                  }`}
                >
                  {/* Selected Box Frame: Ultra smooth sliding rounded box indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeMainMenuIndicator"
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 28,
                        mass: 0.8,
                      }}
                      className="absolute inset-0 bg-[#242629] border border-white/[0.08] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
                    />
                  )}

                  <Icon className={`size-4 relative z-10 transition-colors ${isActive ? 'text-white stroke-[2.2]' : 'text-[#8e939a]'}`} />
                  <span className="relative z-10">{item.label}</span>
                  {item.id === 'notifications' && notifPermission === 'granted' && (
                    <span className="size-1.5 rounded-full bg-[#29e6b2] relative z-10 shadow-[0_0_6px_#29e6b2]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls - Clean & Minimal for Players */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`flex size-9 sm:size-9.5 items-center justify-center rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                soundEnabled
                  ? 'border-[#29e6b2]/40 bg-[#29e6b2]/10 text-[#29e6b2] shadow-[0_0_10px_rgba(41,230,178,0.25)]'
                  : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white'
              }`}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>

            {/* Quick Notification Toggle / State Button */}
            <button
              onClick={() => onSelectTab('notifications')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-3.5 h-9 sm:h-9.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex-shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-[#242629] border-white/20 text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]'
                  : notifPermission === 'granted'
                  ? 'border-[#29e6b2]/30 bg-[#29e6b2]/10 text-[#29e6b2]'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white'
              }`}
              title={notifPermission === 'granted' ? 'แจ้งเตือนเปิดอยู่' : 'เปิดการแจ้งเตือน'}
            >
              <Bell className="size-4 flex-shrink-0" />
              <span className="text-xs hidden sm:inline whitespace-nowrap">
                {notifPermission === 'granted' ? 'แจ้งเตือนเปิด' : 'แจ้งเตือน'}
              </span>
            </button>

            {/* Portal Link (Go to Admin) */}
            {onNavigateAdmin && (
              <button
                onClick={onNavigateAdmin}
                className="flex items-center justify-center gap-1 px-2.5 sm:px-3 h-9 sm:h-9.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/[0.04] hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer flex-shrink-0"
                title="เข้าสู่แผงควบคุมแอดมิน (/admin)"
              >
                <Lock className="size-4 flex-shrink-0" />
                <span className="text-xs hidden md:inline">แอดมิน</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
