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
}) => {
  const menuItems = [
    { id: 'latest' as const, label: 'โค้ด (ล่าสุด)', icon: Flame },
    { id: 'all' as const, label: 'โค้ดทั้งหมด', icon: Package },
    { id: 'notifications' as const, label: 'แจ้งเตือน', icon: Bell },
    { id: 'guide' as const, label: 'วิธีใส่โค้ด', icon: BookOpen },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-2.5 sm:px-4 pt-2 sm:pt-2.5 pointer-events-none">
      <div className="mx-auto max-w-5xl pointer-events-auto">
        {/* Top Floating Glass Bar - Compact & Proportional */}
        <nav className="nav-shell rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between gap-1.5 sm:gap-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.8)]">
          {/* Brand Logo */}
          <div 
            onClick={() => onSelectTab('latest')}
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <div className="size-8 sm:size-8.5 rounded-xl bg-gradient-to-br from-[#29e6b2] to-[#149974] flex items-center justify-center font-black text-black text-xs sm:text-sm shadow-[0_0_12px_rgba(41,230,178,0.35)] flex-shrink-0 tracking-tight">
              OPM
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[13.5px] sm:text-[15px] font-black tracking-tight text-white whitespace-nowrap">
                ONE PUNCH <span className="text-[#29e6b2]">HUB</span>
              </span>
              <span className="text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#29e6b2]/15 text-[#29e6b2] border border-[#29e6b2]/30 uppercase tracking-wider">
                SEA
              </span>
            </div>
          </div>

          {/* Desktop 4 Main Menus with Rounded Box Frame Indicator matching the aesthetic */}
          <div className="hidden md:flex items-center gap-1 bg-[#141618]/90 border border-white/[0.08] p-1 rounded-xl relative shadow-inner">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive ? 'text-white' : 'text-[#8e939a] hover:text-white'
                  }`}
                >
                  {/* Selected Box Frame: Medium dark grey filled rounded box like reference */}
                  {isActive && (
                    <motion.div
                      layoutId="activeMainMenuIndicator"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-[#242629] border border-white/[0.08] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
                    />
                  )}

                  <Icon className={`size-3.5 relative z-10 transition-colors ${isActive ? 'text-white stroke-[2.2]' : 'text-[#8e939a]'}`} />
                  <span className="relative z-10">{item.label}</span>
                  {item.id === 'notifications' && notifPermission === 'granted' && (
                    <span className="size-1.5 rounded-full bg-[#29e6b2] relative z-10 shadow-[0_0_6px_#29e6b2]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls - Responsive & Sleek */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Admin Badge */}
            {isAdmin && onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center justify-center gap-1 px-2.5 sm:px-3 h-8 rounded-xl text-xs font-semibold border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
                title={`ผู้ดูแลระบบ: ${currentUserEmail || AUTHORIZED_ADMIN_EMAIL}`}
              >
                <ShieldCheck className="size-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] hidden lg:inline font-mono">
                  {currentUserEmail || AUTHORIZED_ADMIN_EMAIL}
                </span>
                <span className="text-[11px] lg:hidden font-bold text-emerald-400 leading-none">
                  แอดมิน
                </span>
              </button>
            )}

            {/* Cloudflare Edge Sync Button */}
            {isAdmin && onOpenCloudflareModal && (
              <button
                onClick={onOpenCloudflareModal}
                className="flex items-center justify-center gap-1 px-2 sm:px-2.5 h-8 rounded-xl text-xs font-semibold border border-[#F38020]/40 bg-[#F38020]/10 text-[#FAAD3F] shadow-[0_0_8px_rgba(243,128,32,0.2)] hover:bg-[#F38020]/20 transition-all cursor-pointer flex-shrink-0"
                title="เชื่อมต่อ Cloudflare Edge Storage (บันทึกโค้ดและส่งต่อให้ทุกคน)"
              >
                <Cloud className="size-3.5 text-[#FAAD3F] flex-shrink-0" />
                <span className="text-[11px] hidden sm:inline whitespace-nowrap">Cloudflare</span>
              </button>
            )}

            {/* Quick Add Code Button (Only active for Admin) */}
            {isAdmin && onAddNewCode && (
              <button
                onClick={onAddNewCode}
                className="flex items-center justify-center gap-1 px-2.5 sm:px-3 h-8 rounded-xl text-xs font-bold bg-[#29e6b2] text-black shadow-[0_0_10px_rgba(41,230,178,0.3)] hover:bg-[#34f0bd] active:scale-95 transition-all cursor-pointer flex-shrink-0"
                title="เพิ่มโค้ดใหม่ (เฉพาะแอดมิน)"
              >
                <Plus className="size-3.5 stroke-[2.5] flex-shrink-0" />
                <span className="text-[11px] hidden sm:inline whitespace-nowrap">เพิ่มโค้ด</span>
              </button>
            )}

            {/* Quick Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`flex size-8 items-center justify-center rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                soundEnabled
                  ? 'border-[#29e6b2]/40 bg-[#29e6b2]/10 text-[#29e6b2] shadow-[0_0_8px_rgba(41,230,178,0.2)]'
                  : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white'
              }`}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
            >
              {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </button>

            {/* Quick Notification Toggle / State Button */}
            <button
              onClick={() => onSelectTab('notifications')}
              className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 h-8 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex-shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-[#242629] border-white/20 text-white shadow-[0_0_10px_rgba(0,0,0,0.5)]'
                  : notifPermission === 'granted'
                  ? 'border-[#29e6b2]/30 bg-[#29e6b2]/10 text-[#29e6b2]'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white'
              }`}
              title={notifPermission === 'granted' ? 'แจ้งเตือนเปิดอยู่' : 'เปิดการแจ้งเตือน'}
            >
              <Bell className="size-3.5 flex-shrink-0" />
              <span className="text-[11px] hidden sm:inline whitespace-nowrap">
                {notifPermission === 'granted' ? 'แจ้งเตือนเปิด' : 'แจ้งเตือน'}
              </span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
