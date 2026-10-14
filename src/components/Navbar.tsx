import React from 'react';
import { motion } from 'motion/react';
import { Flame, Package, BookOpen, Volume2, VolumeX, Lock, Languages } from 'lucide-react';
import { Language, translations } from '../utils/translations';

export type MainMenuTab = 'latest' | 'all' | 'guide';

interface NavbarProps {
  activeTab: MainMenuTab;
  onSelectTab: (tab: MainMenuTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
  activeCount?: number;
  onNavigateAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  lang,
  onSelectLang,
  onNavigateAdmin,
}) => {
  const t = translations[lang];

  const menuItems = [
    { id: 'latest' as const, label: t.latestMenu, icon: Flame },
    { id: 'all' as const, label: t.allMenu, icon: Package },
    { id: 'guide' as const, label: t.guideMenu, icon: BookOpen },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-2 sm:px-5 pt-2 sm:pt-3 pointer-events-none">
      <div className="mx-auto max-w-5xl pointer-events-auto">
        {/* Top Floating Glass Bar */}
        <nav className="nav-shell rounded-2xl px-2.5 sm:px-4.5 py-2.5 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-3 shadow-[0_14px_32px_rgba(0,0,0,0.85)]">
          {/* Brand Logo */}
          <div 
            onClick={() => onSelectTab('latest')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer flex-shrink min-w-0"
          >
            <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-[#29e6b2] to-[#149974] flex items-center justify-center font-black text-black text-xs sm:text-sm shadow-[0_0_14px_rgba(41,230,178,0.4)] flex-shrink-0 tracking-tight">
              OPM
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[14px] sm:text-base font-black tracking-tight text-white whitespace-nowrap">
                ONE PUNCH <span className="text-[#29e6b2] hidden min-[350px]:inline">HUB</span>
              </span>
              <span className="hidden min-[420px]:inline-flex text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#29e6b2]/15 text-[#29e6b2] border border-[#29e6b2]/30 uppercase tracking-wider flex-shrink-0">
                SEA
              </span>
            </div>
          </div>

          {/* Desktop 3 Main Menus with Direct Sliding Indicator */}
          <div className="hidden md:grid grid-cols-3 gap-1 bg-[#141618]/90 border border-white/[0.08] p-1.5 rounded-xl relative shadow-inner w-[340px]">
            {/* Sliding background indicator */}
            <motion.div
              className="absolute inset-y-1.5 rounded-lg bg-[#242629] border border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] pointer-events-none"
              initial={false}
              animate={{
                left: `calc(6px + ${Math.max(0, menuItems.findIndex((m) => m.id === activeTab))} * (100% - 12px) / 3)`,
                width: `calc((100% - 12px) / 3)`,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 32,
                mass: 0.8,
              }}
            />

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs sm:text-[13px] font-medium transition-colors duration-200 cursor-pointer select-none ${
                    isActive ? 'text-white font-semibold' : 'text-[#8e939a] hover:text-white'
                  }`}
                >
                  <Icon className={`size-4 relative z-10 transition-colors ${isActive ? 'text-white stroke-[2.2]' : 'text-[#8e939a]'}`} />
                  <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Sound FX + Language Selector (TH/EN) + Admin Portal */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`flex size-9 sm:size-10 items-center justify-center rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                soundEnabled
                  ? 'border-[#29e6b2]/40 bg-[#29e6b2]/10 text-[#29e6b2] shadow-[0_0_10px_rgba(41,230,178,0.25)]'
                  : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white'
              }`}
              title={soundEnabled ? (lang === 'en' ? 'Mute Sound FX' : 'ปิดเสียงเอฟเฟกต์') : (lang === 'en' ? 'Unmute Sound FX' : 'เปิดเสียงเอฟเฟกต์')}
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>

            {/* Single Toggle Button for Language (TH ⇄ EN) */}
            <button
              type="button"
              onClick={() => onSelectLang(lang === 'th' ? 'en' : 'th')}
              className="flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/10 hover:border-[#29e6b2]/40 transition-all cursor-pointer select-none active:scale-95 flex-shrink-0"
              title={lang === 'th' ? 'กดเพื่อเปลี่ยนเป็นภาษาอังกฤษ (EN)' : 'Click to switch to Thai (TH)'}
            >
              <Languages className="size-4 text-[#29e6b2]" />
              <span className="text-xs font-bold text-white tracking-wider">
                {lang.toUpperCase()}
              </span>
            </button>

            {/* Portal Link (Go to Admin) */}
            {onNavigateAdmin && (
              <button
                onClick={onNavigateAdmin}
                className="flex items-center justify-center gap-1 size-9 sm:h-10 sm:w-auto sm:px-3 rounded-xl text-xs font-semibold border border-white/10 bg-white/[0.04] hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer flex-shrink-0"
                title={lang === 'en' ? 'Admin Portal (/admin)' : 'เข้าสู่แผงควบคุมแอดมิน (/admin)'}
              >
                <Lock className="size-4 flex-shrink-0" />
                <span className="text-xs hidden md:inline">{t.adminMenu}</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
