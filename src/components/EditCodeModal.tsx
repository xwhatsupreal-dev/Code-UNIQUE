import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, AlertCircle, Edit3, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { RedeemCode, CodeStatus } from '../types/code';
import { AUTHORIZED_ADMIN_EMAIL } from '../types/auth';

interface EditCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: RedeemCode | null;
  onSave: (updatedCode: RedeemCode) => void;
  currentEmail?: string | null;
}

export const EditCodeModal: React.FC<EditCodeModalProps> = ({
  isOpen,
  onClose,
  code,
  onSave,
  currentEmail = AUTHORIZED_ADMIN_EMAIL,
}) => {
  const [codeStr, setCodeStr] = useState('');
  const [status, setStatus] = useState<CodeStatus>('ACTIVE');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('???');
  const [isHot, setIsHot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      setCodeStr(code.code);
      setStatus(code.status);
      setDescription(code.description || '');
      setExpiresAt(code.expiresAt || '???');
      setIsHot(!!code.isHot);
      setError(null);
    }
  }, [code]);

  if (!isOpen || !code) return null;

  const isAdmin = (currentEmail || '').toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      setError(`ปฏิเสธสิทธิ์: เฉพาะ ${AUTHORIZED_ADMIN_EMAIL} เท่านั้นที่มีสิทธิ์แก้ไขโค้ด`);
      return;
    }

    const cleanCode = codeStr.trim().toUpperCase();
    if (!cleanCode) {
      setError('กรุณาระบุรหัสโค้ด');
      return;
    }

    const updated: RedeemCode = {
      ...code,
      code: cleanCode,
      status,
      description: description.trim(),
      expiresAt: expiresAt.trim() || '???',
      isHot,
      verifiedWorking: status === 'ACTIVE',
    };

    onSave(updated);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#0e1012] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#29e6b2]/10 border border-[#29e6b2]/30 flex items-center justify-center text-[#29e6b2]">
                <Edit3 className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  แก้ไขโค้ด
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SEA
                  </span>
                </h3>
                <p className="text-xs text-white/40">
                  สิทธิ์ผู้ดูแลระบบ: <span className="text-[#29e6b2]">{AUTHORIZED_ADMIN_EMAIL}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {!isAdmin && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <ShieldAlert className="size-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>คุณไม่มีสิทธิ์แก้ไขโค้ดนี้ เฉพาะผู้ใช้อีเมล <strong>{AUTHORIZED_ADMIN_EMAIL}</strong> เท่านั้น</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Code Input */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                รหัสโค้ด <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={codeStr}
                onChange={(e) => {
                  setCodeStr(e.target.value.toUpperCase());
                  setError(null);
                }}
                disabled={!isAdmin}
                placeholder="เช่น OPM2026TH"
                className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-mono font-bold tracking-wider text-base focus:outline-none focus:border-[#29e6b2] focus:ring-1 focus:ring-[#29e6b2] transition-colors disabled:opacity-50"
              />
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                สถานะของโค้ด
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setStatus('ACTIVE')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <span className="size-2 rounded-full bg-emerald-400" />
                  ใช้งานได้ (ACTIVE)
                </button>
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setStatus('EXPIRED')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                    status === 'EXPIRED'
                      ? 'bg-rose-500/15 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                      : 'bg-white/[0.02] border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <span className="size-2 rounded-full bg-rose-400" />
                  หมดอายุแล้ว (EXPIRED)
                </button>
              </div>
            </div>

            {/* Expiration Date Input (defaults to ???) */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5 flex items-center justify-between">
                <span>วันหมดอายุ</span>
                <span className="text-[11px] text-white/40">ค่าเริ่มต้น ??? ตามคำขอ</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="???"
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-[#29e6b2] transition-colors disabled:opacity-50"
                />
                <Clock className="absolute right-3.5 top-3 size-4 text-white/30" />
              </div>
            </div>

            {/* Description / Note */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                คำอธิบายเพิ่มเติม / บันทึก (ไม่บังคับ)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin}
                rows={2}
                placeholder="เช่น โค้ดฉลองครบรอบ, เซิร์ฟเวอร์ SEA"
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white text-xs leading-relaxed focus:outline-none focus:border-[#29e6b2] transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Hot badge toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                <span className="text-xs text-white/80 font-medium">ติดแท็กโค้ดยอดนิยม (HOT)</span>
              </div>
              <input
                type="checkbox"
                checked={isHot}
                onChange={(e) => setIsHot(e.target.checked)}
                disabled={!isAdmin}
                className="size-4 rounded accent-[#29e6b2] cursor-pointer"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!isAdmin}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#29e6b2] text-black hover:bg-[#34f0bd] shadow-[0_0_15px_rgba(41,230,178,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="size-3.5 stroke-[2.5]" />
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
