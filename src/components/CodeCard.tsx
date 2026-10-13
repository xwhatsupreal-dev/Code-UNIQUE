import React, { useState } from 'react';
import { Check, Copy, CheckCircle2, Clock, Sparkles, Trash2, RefreshCw, Edit3 } from 'lucide-react';
import { RedeemCode } from '../types/code';

interface CodeCardProps {
  code: RedeemCode;
  isRedeemed: boolean;
  canEdit?: boolean;
  onToggleRedeemed: (id: string) => void;
  onCopy: (codeStr: string) => void;
  onEdit?: (code: RedeemCode) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

export const CodeCard: React.FC<CodeCardProps> = ({
  code,
  isRedeemed,
  canEdit = false,
  onToggleRedeemed,
  onCopy,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = code.status === 'EXPIRED';

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden ${
        isExpired
          ? 'border-white/[0.04] bg-[#0c0d0e]/40 opacity-70'
          : isRedeemed
          ? 'border-emerald-500/20 bg-[#0c0d0e]/70'
          : 'border-white/[0.08] bg-[#0c0d0e]/90 hover:border-[#29e6b2]/40 hover:shadow-[0_12px_32px_rgba(0,0,0,0.8),0_0_24px_rgba(41,230,178,0.06)]'
      }`}
    >
      {/* Top Accent Gradient Bar if New & Active */}
      {code.isNew && !isExpired && (
        <div className="h-0.5 w-full bg-gradient-to-r from-[#29e6b2] via-emerald-400 to-[#29e6b2]" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header: Server · Status · Mark as Redeemed · Edit / Delete (Admin Only) */}
        <div className="flex items-center justify-between gap-2 mb-3 text-xs">
          <div className="flex items-center gap-1.5 text-white/50">
            {code.isNew && !isExpired && (
              <>
                <span className="text-[#29e6b2] font-semibold flex items-center gap-1">
                  <Sparkles className="size-3" />
                  NEW
                </span>
                <span className="text-white/20">·</span>
              </>
            )}
            <span className="font-medium text-[#29e6b2]/90">
              เซิร์ฟเวอร์ SEA
            </span>
            <span className="text-white/20">·</span>
            <span className="text-white/40">{code.addedAt}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Claimed Toggle Badge */}
            <button
              onClick={() => onToggleRedeemed(code.id)}
              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                isRedeemed
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium'
                  : 'border-white/10 bg-white/[0.02] text-white/40 hover:text-white/80 hover:border-white/20'
              }`}
              title="บันทึกว่าแลกโค้ดนี้แล้ว"
            >
              <CheckCircle2 className={`size-3 ${isRedeemed ? 'text-emerald-400' : 'text-white/30'}`} />
              <span>{isRedeemed ? 'แลกแล้ว' : 'ยังไม่แลก'}</span>
            </button>

            {/* Admin-only controls: Edit & Delete buttons */}
            {canEdit && (
              <div className="flex items-center gap-1 pl-1 border-l border-white/10">
                {onEdit && (
                  <button
                    onClick={() => onEdit(code)}
                    className="size-6 rounded-full flex items-center justify-center text-white/30 hover:text-[#29e6b2] hover:bg-[#29e6b2]/10 transition-colors cursor-pointer"
                    title="แก้ไขโค้ด"
                  >
                    <Edit3 className="size-3" />
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => onDelete(code.id)}
                    className="size-6 rounded-full flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="ลบโค้ดนี้"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Code Box & SwitchHub 1-Tap Pill Copy */}
        <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-black/80 border border-white/10 mb-3 group-hover:border-white/20 transition-colors">
          <div className="font-mono text-base sm:text-lg font-black tracking-wider text-[#29e6b2] select-all truncate pl-1">
            {code.code}
          </div>

          <button
            onClick={handleCopy}
            disabled={isExpired}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full font-bold text-xs sm:text-sm px-4 py-2 transition-all duration-200 flex-shrink-0 cursor-pointer active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : isExpired
                ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                : 'bg-[#29e6b2] text-black hover:bg-[#34f0bd] hover:shadow-[0_0_18px_rgba(41,230,178,0.45)]'
            }`}
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-black" />
                <span>คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>คัดลอก</span>
              </>
            )}
          </button>
        </div>

        {/* Description (No rewards mentioned) */}
        {code.description && (
          <p className="text-xs text-white/55 leading-relaxed line-clamp-2 mb-3">
            {code.description}
          </p>
        )}

        {/* Expiry Date & Status Switcher */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-white/40 pt-2.5 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-white/30" />
            <span>
              {isExpired ? (
                <>วันหมดอายุ: <strong className="text-white/40 font-mono font-bold tracking-wider">???</strong> <span className="text-rose-400/90 font-medium ml-1">(หมดอายุแล้ว)</span></>
              ) : (
                <>วันหมดอายุ: <strong className="text-amber-300 font-mono font-bold tracking-wider">???</strong></>
              )}
            </span>
          </div>

          {canEdit && onToggleStatus ? (
            <button
              onClick={() => onToggleStatus(code.id)}
              className="text-[10px] text-white/40 hover:text-[#29e6b2] flex items-center gap-1 cursor-pointer transition-colors"
              title="สลับสถานะ ใช้งานได้ / หมดอายุ (แอดมิน)"
            >
              <RefreshCw className="size-2.5" />
              <span>{isExpired ? 'เปลี่ยนเป็นใช้งานได้' : 'เปลี่ยนเป็นหมดอายุ'}</span>
            </button>
          ) : (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              isExpired ? 'bg-rose-500/10 text-rose-400/80 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20'
            }`}>
              {isExpired ? 'หมดอายุ' : 'ใช้งานได้'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
