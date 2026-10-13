import React from 'react';
import { Copy, Sparkles } from 'lucide-react';
import { RedeemCode } from '../types/code';

interface HeroBannerProps {
  codes: RedeemCode[];
  onBatchCopy: () => void;
  onSimulateLiveDrop?: () => void;
  isSimulating?: boolean;
  lastUpdated?: string;
  onAddNewCode?: () => void;
  isAdmin?: boolean;
  onOpenAuthModal?: () => void;
  onOpenCloudflareModal?: () => void;
  isCloudflareConnected?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  codes,
  onBatchCopy,
  onSimulateLiveDrop,
  isSimulating,
  onAddNewCode,
  isAdmin = false,
  onOpenAuthModal,
  onOpenCloudflareModal,
  isCloudflareConnected = false,
}) => {
  const activeCodes = codes.filter((c) => c.status === 'ACTIVE');
  const latestCode = activeCodes[0];

  return (
    <div className="relative pt-28 sm:pt-28 pb-8 overflow-hidden text-center">
      {/* Background Radial Glow & Grid (SwitchHub Signature) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(41,230,178,0.14),rgba(5,5,5,0.08)_38%,rgba(5,5,5,0.95)_85%)]" />
        <div className="absolute inset-0 bg-mesh-grid opacity-[0.06] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        
        {/* Subtle Star Twinkles */}
        <span className="absolute rounded-full bg-white/70 shadow-[0_0_9px_2px_rgba(41,230,178,0.3)] animate-twinkle" style={{ top: '15%', left: '12%', width: '2px', height: '2px' }} />
        <span className="absolute rounded-full bg-white/70 shadow-[0_0_9px_2px_rgba(41,230,178,0.3)] animate-twinkle" style={{ top: '22%', right: '15%', width: '2px', height: '2px', animationDelay: '0.6s' }} />
        <span className="absolute rounded-full bg-white/70 shadow-[0_0_9px_2px_rgba(41,230,178,0.3)] animate-twinkle" style={{ top: '48%', left: '8%', width: '2px', height: '2px', animationDelay: '1.2s' }} />
        <span className="absolute rounded-full bg-white/70 shadow-[0_0_9px_2px_rgba(41,230,178,0.3)] animate-twinkle" style={{ top: '40%', right: '10%', width: '2px', height: '2px', animationDelay: '1.8s' }} />
      </div>

      {/* SwitchHub Top Bar Indicators */}
      {latestCode && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 px-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-black/60 backdrop-blur-md text-xs text-white/70 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.8)]">
            <span className="flex size-2 rounded-full bg-[#29e6b2] animate-pulse" />
            <span className="text-[#29e6b2] font-semibold">โค้ดล่าสุด:</span>
            <span className="font-mono font-bold text-white select-all">{latestCode.code}</span>
            <span className="text-white/30">·</span>
            <span className="text-white/50 text-[11px]">เซิร์ฟเวอร์ SEA</span>
          </div>
        </div>
      )}

      {/* Hero Badge Tag */}
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#29e6b2] mb-3">
        <Sparkles className="size-3.5" />
        <span>// OFFICIAL REDEEM HUB · SEA SERVER</span>
      </div>

      {/* Hero Title */}
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight sm:leading-none mb-3">
        โค้ดเกม <span className="text-[#29e6b2]">OPM The Strongest</span>
      </h1>

      {/* Hero Subtitle */}
      <p className="text-xs sm:text-sm text-white/60 max-w-xl mx-auto leading-relaxed mb-6 px-4">
        รวบรวมโค้ดเกม ONE PUNCH MAN: The Strongest สำหรับเซิร์ฟเวอร์ SEA อัปเดตแบบเรียลไทม์ ใช้งานได้จริง
      </p>

      {/* Status Summary Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-7 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-[#0c0d0e]/80 text-white/80 backdrop-blur-sm">
          <span className="size-1.5 rounded-full bg-[#29e6b2]" />
          <span className="text-white/50">พร้อมใช้งาน:</span>
          <strong className="text-[#29e6b2] font-mono font-bold">{activeCodes.length} โค้ด</strong>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-[#0c0d0e]/80 text-white/80 backdrop-blur-sm">
          <span className="text-white/50">เซิร์ฟเวอร์:</span>
          <strong className="text-white font-mono font-bold">SEA เท่านั้น</strong>
        </div>
      </div>

      {/* SwitchHub Action Buttons (Pill Shapes) */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-4">
        <button
          onClick={onBatchCopy}
          disabled={activeCodes.length === 0}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 text-xs sm:text-sm h-11 px-6 sm:px-8 bg-[#29e6b2] text-black shadow-[0_0_28px_rgba(41,230,178,0.45)] hover:shadow-[0_0_36px_rgba(41,230,178,0.6)] cursor-pointer disabled:opacity-40"
        >
          <Copy className="size-4 stroke-[2.2]" />
          <span>คัดลอกโค้ดทั้งหมด ({activeCodes.length})</span>
        </button>
      </div>
    </div>
  );
};
