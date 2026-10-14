import React, { useState } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import { RedeemCode } from '../types/code';
import { Language, translations } from '../utils/translations';

interface BatchCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  codes: RedeemCode[];
  onCopySuccess: () => void;
  lang?: Language;
}

export const BatchCopyModal: React.FC<BatchCopyModalProps> = ({
  isOpen,
  onClose,
  codes,
  onCopySuccess,
  lang = 'th',
}) => {
  const [copied, setCopied] = useState(false);
  const t = translations[lang];
  const activeCodes = codes.filter((c) => c.status === 'ACTIVE');

  if (!isOpen) return null;

  const rawListText = activeCodes.map((c) => c.code).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawListText);
    setCopied(true);
    onCopySuccess();
    setTimeout(() => setCopied(false), 2500);
  };

  const modalSubText = t.modalSub.replace('{count}', String(activeCodes.length));
  const modalCopyBtnText = t.modalCopyBtn.replace('{count}', String(activeCodes.length));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0c0d0e] border border-white/10 rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-black/50">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-[#29e6b2]/10 border border-[#29e6b2]/30 text-[#29e6b2] flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">{t.modalTitle}</h2>
              <p className="text-[11px] text-white/50">{modalSubText}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="bg-black/90 border border-white/10 rounded-xl p-3 font-mono text-xs sm:text-sm text-[#29e6b2] leading-relaxed max-h-48 overflow-y-auto select-all">
            {activeCodes.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-none">
                <span>{c.code}</span>
                <span className="text-[11px] text-white/40 font-sans">{c.server}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-white/40 leading-relaxed">
            {t.modalNote}
          </p>

          <button
            onClick={handleCopy}
            className={`w-full py-3 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(41,230,178,0.3)] ${
              copied
                ? 'bg-emerald-500 text-black'
                : 'bg-[#29e6b2] hover:bg-[#34f0bd] text-black hover:scale-[1.01] active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="size-4 text-black" />
                <span>{t.modalCopiedBtn}</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>{modalCopyBtnText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
