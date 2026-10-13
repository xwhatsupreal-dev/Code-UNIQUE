import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Sparkles, Check, AlertCircle, Layers, ShieldCheck, ShieldAlert } from 'lucide-react';
import { RedeemCode, CodeStatus } from '../types/code';
import { AUTHORIZED_ADMIN_EMAIL } from '../types/auth';

interface AddCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCode: (codeData: Omit<RedeemCode, 'id'>) => void;
  onBatchAddCodes?: (codesData: Array<Omit<RedeemCode, 'id'>>) => void;
  isAdmin?: boolean;
  currentEmail?: string | null;
}

export const AddCodeModal: React.FC<AddCodeModalProps> = ({
  isOpen,
  onClose,
  onAddCode,
  onBatchAddCodes,
  isAdmin = true,
  currentEmail = AUTHORIZED_ADMIN_EMAIL,
}) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  
  // Single Code State
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<CodeStatus>('ACTIVE');
  const [description, setDescription] = useState('');
  const [isHot, setIsHot] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Batch Codes State
  const [batchText, setBatchText] = useState('');
  const [batchStatus, setBatchStatus] = useState<CodeStatus>('ACTIVE');

  if (!isOpen) return null;

  const isAuthorized = isAdmin ?? true;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError('กรุณาระบุรหัสโค้ด');
      return;
    }

    if (cleanCode.length < 2) {
      setError('รหัสโค้ดต้องมีความยาวอย่างน้อย 2 ตัวอักษร');
      return;
    }

    onAddCode({
      code: cleanCode,
      server: 'SEA',
      status,
      rewards: [],
      description: description.trim() || 'โค้ดเซิร์ฟเวอร์ SEA',
      addedAt: 'ล่าสุด',
      addedAtTimestamp: Date.now(),
      expiresAt: '???',
      verifiedWorking: status === 'ACTIVE',
      workingVotes: status === 'ACTIVE' ? 10 : 0,
      expiredVotes: status === 'EXPIRED' ? 10 : 0,
      isNew: true,
      isHot,
    });

    // Reset & close
    setCode('');
    setDescription('');
    setIsHot(false);
    setError(null);
    onClose();
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Split by newlines, commas, semicolons, or spaces
    const lines = batchText
      .split(/[\r\n,;]+/)
      .map((line) => line.trim().toUpperCase())
      .filter((line) => line.length >= 2);

    if (lines.length === 0) {
      setError('กรุณาวางรหัสโค้ดอย่างน้อย 1 โค้ด (แยกบรรทัดหรือคั่นด้วยจุลภาค)');
      return;
    }

    // Remove duplicates within the batch
    const uniqueCodes = Array.from(new Set(lines));

    const newCodesList: Array<Omit<RedeemCode, 'id'>> = uniqueCodes.map((c, index) => ({
      code: c,
      server: 'SEA',
      status: batchStatus,
      rewards: [],
      description: 'โค้ดเซิร์ฟเวอร์ SEA',
      addedAt: 'ล่าสุด',
      addedAtTimestamp: Date.now() + (uniqueCodes.length - index),
      expiresAt: '???',
      verifiedWorking: batchStatus === 'ACTIVE',
      workingVotes: batchStatus === 'ACTIVE' ? 5 : 0,
      expiredVotes: batchStatus === 'EXPIRED' ? 5 : 0,
      isNew: true,
      isHot: false,
    }));

    if (onBatchAddCodes) {
      onBatchAddCodes(newCodesList);
    } else {
      newCodesList.forEach((item) => onAddCode(item));
    }

    setBatchText('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c0d0e]/95 p-6 shadow-2xl backdrop-blur-xl z-10 overflow-hidden"
        >
          {/* Top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#29e6b2] shadow-[0_0_20px_#29e6b2]" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-[#29e6b2]/10 border border-[#29e6b2]/30 flex items-center justify-center text-[#29e6b2]">
                <Plus className="size-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  เพิ่มโค้ด ONE PUNCH MAN
                </h3>
                <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="size-3 text-[#29e6b2]" />
                  ระบบจัดการโค้ดแอดมิน
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Mode Switcher: Single vs Batch */}
          <div className="flex p-1 rounded-2xl bg-black/60 border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('single');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'single'
                  ? 'bg-[#29e6b2] text-black shadow-[0_0_12px_rgba(41,230,178,0.3)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Plus className="size-3.5" />
              <span>เพิ่มทีละโค้ด</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('batch');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'batch'
                  ? 'bg-[#29e6b2] text-black shadow-[0_0_12px_rgba(41,230,178,0.3)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Layers className="size-3.5" />
              <span>เพิ่มทีละหลายโค้ด (วางเป็นชุด)</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Single Form Mode */}
          {mode === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  รหัสโค้ด <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    disabled={!isAuthorized}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="เช่น OPM2026TH"
                    className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-white font-mono font-bold text-base focus:border-[#29e6b2] focus:outline-none focus:ring-1 focus:ring-[#29e6b2] transition-all placeholder:text-white/20 disabled:opacity-50"
                    autoFocus
                  />
                  <span className="absolute right-3.5 top-3.5 text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-white/40">
                    SEA
                  </span>
                </div>
              </div>

              {/* Status Switcher */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  สถานะเริ่มต้น
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isAuthorized}
                    onClick={() => setStatus('ACTIVE')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      status === 'ACTIVE'
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'border-white/10 bg-white/[0.02] text-white/50 hover:text-white'
                    }`}
                  >
                    <span className="size-2 rounded-full bg-emerald-400" />
                    <span>ใช้งานได้ (ACTIVE)</span>
                  </button>
                  <button
                    type="button"
                    disabled={!isAuthorized}
                    onClick={() => setStatus('EXPIRED')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      status === 'EXPIRED'
                        ? 'border-rose-500/50 bg-rose-500/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'border-white/10 bg-white/[0.02] text-white/50 hover:text-white'
                    }`}
                  >
                    <span className="size-2 rounded-full bg-rose-400" />
                    <span>หมดอายุแล้ว (EXPIRED)</span>
                  </button>
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  บันทึกเพิ่มเติม (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  disabled={!isAuthorized}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="เช่น โค้ดฉลองครบรอบ 1 ปี"
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 text-white text-xs focus:border-[#29e6b2] focus:outline-none transition-all placeholder:text-white/20 disabled:opacity-50"
                />
              </div>

              {/* Rule reminder */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-white/40 leading-relaxed">
                <span className="text-[#29e6b2] font-semibold">หมายเหตุ:</span> โค้ดใหม่จะขึ้นมาอยู่บนสุดทันที · วันหมดอายุจะแสดงเป็น <strong>???</strong> โดยอัตโนมัติ
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!isAuthorized}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-[#29e6b2] text-black hover:bg-[#34f0bd] shadow-[0_0_20px_rgba(41,230,178,0.4)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                  <span>บันทึกโค้ด</span>
                </button>
              </div>
            </form>
          ) : (
            /* Batch Mode */
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  วางรหัสโค้ด (แยก 1 บรรทัดต่อ 1 โค้ด)
                </label>
                <textarea
                  value={batchText}
                  disabled={!isAuthorized}
                  onChange={(e) => {
                    setBatchText(e.target.value);
                    setError(null);
                  }}
                  rows={5}
                  placeholder={`OPMNEW2026\nONEPUNCHMAN2026\nSAITAMASTRONG\nHEROESPASS2026`}
                  className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-[#29e6b2] focus:outline-none focus:ring-1 focus:ring-[#29e6b2] transition-all placeholder:text-white/20 resize-none disabled:opacity-50"
                  autoFocus
                />
              </div>

              {/* Batch Status */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  กำหนดสถานะสำหรับโค้ดชุดนี้
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isAuthorized}
                    onClick={() => setBatchStatus('ACTIVE')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      batchStatus === 'ACTIVE'
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'border-white/10 bg-white/[0.02] text-white/50 hover:text-white'
                    }`}
                  >
                    <span className="size-2 rounded-full bg-emerald-400" />
                    <span>ทั้งหมดใช้งานได้</span>
                  </button>
                  <button
                    type="button"
                    disabled={!isAuthorized}
                    onClick={() => setBatchStatus('EXPIRED')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      batchStatus === 'EXPIRED'
                        ? 'border-rose-500/50 bg-rose-500/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'border-white/10 bg-white/[0.02] text-white/50 hover:text-white'
                    }`}
                  >
                    <span className="size-2 rounded-full bg-rose-400" />
                    <span>ทั้งหมดหมดอายุ</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!isAuthorized}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-[#29e6b2] text-black hover:bg-[#34f0bd] shadow-[0_0_20px_rgba(41,230,178,0.4)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="size-3.5 stroke-[2.5]" />
                  <span>เพิ่มโค้ดทั้งหมด</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
