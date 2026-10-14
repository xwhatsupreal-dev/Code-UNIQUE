import React, { useState } from 'react';
import { Check, Copy, CheckCircle2, Clock, Sparkles, Trash2, RefreshCw, Edit3 } from 'lucide-react';
import { RedeemCode } from '../types/code';
import { isCodeLatest, formatCodeTime } from '../utils/dateFormatter';
import { Language, translations } from '../utils/translations';

interface CodeCardProps {
  code: RedeemCode;
  isRedeemed: boolean;
  canEdit?: boolean;
  lang?: Language;
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
  lang = 'th',
  onToggleRedeemed,
  onCopy,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  const handleCopy = () => {
    onCopy(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpired = code.status === 'EXPIRED';
  const isLatest = isCodeLatest(code);
  const timeInfo = formatCodeTime(code.addedAtTimestamp, code.addedAt, lang);

  return (
    <div
      className={`group relative rounded-xl sm:rounded-2xl border transition-all duration-200 backdrop-blur-md overflow-hidden ${
        isExpired
          ? 'border-white/[0.04] bg-[#0c0d0e]/40 opacity-75'
          : isRedeemed
          ? 'border-emerald-500/25 bg-[#0c0d0e]/75 shadow-sm'
          : 'border-white/[0.08] bg-[#0c0d0e]/90 hover:border-[#29e6b2]/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_20px_rgba(41,230,178,0.06)]'
      }`}
    >
      {/* Top Accent Line if Latest & Active (7-day window) */}
      {isLatest && !isExpired && (
        <div className="h-[2px] w-full bg-gradient-to-r from-[#29e6b2] via-emerald-400 to-[#29e6b2]" />
      )}

      <div className="p-3 sm:p-3.5">
        {/* Compact Header: Badges & Actions */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          {/* Left: Latest + Server + Working Status */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isLatest && !isExpired && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#29e6b2]/15 border border-[#29e6b2]/35 text-[#29e6b2] font-bold text-[10px] tracking-tight">
                <Sparkles className="size-2.5" />
                {t.badgeLatest}
              </span>
            )}
            <span className="text-[10px] font-mono font-bold text-[#29e6b2]/90 bg-[#29e6b2]/10 border border-[#29e6b2]/20 px-1.5 py-0.5 rounded">
              SEA
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isExpired
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isExpired ? t.statusExpired : isLatest ? t.statusWorking : t.statusLikelyWorking}
            </span>
          </div>

          {/* Right: Claimed Toggle & Admin Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onToggleRedeemed(code.id)}
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                isRedeemed
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-white/[0.03] text-white/40 hover:text-white/80 hover:border-white/20'
              }`}
              title={t.markRedeemedTitle}
            >
              <CheckCircle2 className={`size-3 ${isRedeemed ? 'text-emerald-400' : 'text-white/30'}`} />
              <span>{isRedeemed ? t.redeemed : t.notRedeemed}</span>
            </button>

            {canEdit && (
              <div className="flex items-center gap-1 pl-1 border-l border-white/10">
                {onEdit && (
                  <button
                    onClick={() => onEdit(code)}
                    className="size-5 rounded flex items-center justify-center text-white/30 hover:text-[#29e6b2] hover:bg-[#29e6b2]/10 transition-colors cursor-pointer"
                    title="แก้ไขโค้ด"
                  >
                    <Edit3 className="size-2.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(code.id)}
                    className="size-5 rounded flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="ลบโค้ด"
                  >
                    <Trash2 className="size-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compact Hero Code Box & 1-Tap Copy */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-black/85 border border-white/[0.08] group-hover:border-white/20 transition-all mb-2">
          <div className="font-mono text-sm sm:text-base font-black tracking-wider text-[#29e6b2] select-all truncate pl-0.5">
            {code.code}
          </div>

          <button
            onClick={handleCopy}
            disabled={isExpired}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg sm:rounded-full font-bold text-xs px-3 sm:px-3.5 py-1.5 transition-all duration-200 flex-shrink-0 cursor-pointer active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : isExpired
                ? 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                : 'bg-[#29e6b2] text-black hover:bg-[#34f0bd] hover:shadow-[0_0_14px_rgba(41,230,178,0.4)]'
            }`}
          >
            {copied ? (
              <>
                <Check className="size-3 text-black stroke-[2.5]" />
                <span>{t.copiedBtn}</span>
              </>
            ) : (
              <>
                <Copy className="size-3" />
                <span>{t.copyBtn}</span>
              </>
            )}
          </button>
        </div>

        {/* Description */}
        {code.description && (
          <p className="text-[11px] text-white/50 leading-relaxed truncate mb-2 px-0.5">
            {code.description}
          </p>
        )}

        {/* Compact Footer: Time Arrived & Expiry Date */}
        <div className="flex items-center justify-between gap-2 text-[10.5px] text-white/45 pt-1.5 border-t border-white/[0.05]">
          {/* Time Arrived */}
          <div
            className="flex items-center gap-1 truncate text-white/60"
            title={`${t.arrivedAt} ${timeInfo.full}`}
          >
            <Clock className="size-2.5 text-[#29e6b2]/90 flex-shrink-0" />
            <span className="truncate">
              {t.arrivedAt} <strong className="text-white/80 font-normal">{timeInfo.relative}</strong>
            </span>
          </div>

          {/* Expiry / Admin Switcher */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {canEdit && onToggleStatus ? (
              <button
                onClick={() => onToggleStatus(code.id)}
                className="text-[10px] text-white/40 hover:text-[#29e6b2] flex items-center gap-1 cursor-pointer transition-colors"
                title="สลับสถานะ"
              >
                <RefreshCw className="size-2.5" />
                <span>{isExpired ? 'เปิดใช้' : 'ปิด'}</span>
              </button>
            ) : (
              <span>
                {t.expiresAt}{' '}
                <strong className={`font-mono ${isExpired ? 'text-rose-400/80' : 'text-amber-300/80'}`}>
                  ???
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
