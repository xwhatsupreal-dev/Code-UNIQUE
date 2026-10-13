import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, ShieldAlert, Check, Mail, Lock, Eye, EyeOff, UserCheck, AlertTriangle } from 'lucide-react';
import { AUTHORIZED_ADMIN_EMAIL } from '../types/auth';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string | null;
  isAdmin: boolean;
  onLoginAsAdmin: (email: string) => void;
  onSwitchToGuest: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  isAdmin,
  onLoginAsAdmin,
  onSwitchToGuest,
}) => {
  const [inputEmail, setInputEmail] = useState(currentUserEmail || AUTHORIZED_ADMIN_EMAIL);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputEmail.trim().toLowerCase();

    if (!clean) {
      setError('กรุณากรอกอีเมลที่ต้องการเข้าสู่ระบบ');
      setSuccessMsg(null);
      return;
    }

    if (clean === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      setError(null);
      setSuccessMsg(`ยืนยันสิทธิ์แอดมินสำเร็จ! อีเมล ${AUTHORIZED_ADMIN_EMAIL} มีสิทธิ์เพิ่มและแก้ไขโค้ด`);
      onLoginAsAdmin(AUTHORIZED_ADMIN_EMAIL);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setSuccessMsg(null);
      setError(`⛔ ปฏิเสธการเข้าถึง: อีเมล "${clean}" ไม่ได้รับอนุญาต ระบบกำหนดให้เฉพาะ "${AUTHORIZED_ADMIN_EMAIL}" เท่านั้นที่สามารถเพิ่มหรือแก้ไขโค้ดได้`);
    }
  };

  const handleQuickAdminLogin = () => {
    setInputEmail(AUTHORIZED_ADMIN_EMAIL);
    setError(null);
    setSuccessMsg(`ยินดีต้อนรับแอดมิน ${AUTHORIZED_ADMIN_EMAIL}! เข้าสู่ระบบเรียบร้อย`);
    onLoginAsAdmin(AUTHORIZED_ADMIN_EMAIL);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleGuestToggle = () => {
    onSwitchToGuest();
    setError(null);
    setSuccessMsg('สลับไปยังโหมดผู้ชมทั่วไปแล้ว (อ่านอย่างเดียว ไม่สามารถเพิ่ม/แก้ไขโค้ดได้)');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#0e1012] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#29e6b2]/10 border border-[#29e6b2]/30 flex items-center justify-center text-[#29e6b2]">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  ระบบจำกัดสิทธิ์ผู้ดูแล (Admin Auth)
                </h3>
                <p className="text-xs text-white/40">
                  จัดการสิทธิ์การเพิ่มและแก้ไขโค้ด
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

          <div className="p-6 space-y-4">
            {/* Authorized Admin Notice Box */}
            <div className="p-3.5 rounded-xl bg-[#29e6b2]/5 border border-[#29e6b2]/20 text-xs">
              <div className="flex items-center gap-2 text-[#29e6b2] font-semibold mb-1">
                <Lock className="size-3.5" />
                <span>อีเมลที่ได้รับอนุญาตเพียงผู้เดียว</span>
              </div>
              <p className="font-mono text-white/90 font-bold bg-black/40 px-2 py-1 rounded border border-white/5 select-all">
                {AUTHORIZED_ADMIN_EMAIL}
              </p>
              <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">
                ตามข้อกำหนดของระบบ: บุคคลทั่วไปหรืออีเมลอื่นจะไม่สามารถกดเพิ่มหรือแก้ไขโค้ดได้
              </p>
            </div>

            {/* Current Status Pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <span className="text-white/60">สถานะปัจจุบันของคุณ:</span>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  👑 แอดมิน ({AUTHORIZED_ADMIN_EMAIL})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 font-medium text-[11px]">
                  <Eye className="size-3" />
                  ผู้ชมทั่วไป (อ่านอย่างเดียว)
                </span>
              )}
            </div>

            {/* Feedback Messages */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <ShieldAlert className="size-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="size-4 flex-shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Email verification input */}
            <form onSubmit={handleVerifyAndLogin} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1.5">
                  ระบุอีเมลเพื่อยืนยันตัวตน
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={inputEmail}
                    onChange={(e) => {
                      setInputEmail(e.target.value);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    placeholder="teerasit.thanwa@gmail.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-medium text-xs focus:outline-none focus:border-[#29e6b2] transition-colors"
                  />
                  <Mail className="absolute left-3 top-3 size-3.5 text-white/40" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#29e6b2] text-black hover:bg-[#34f0bd] shadow-[0_0_12px_rgba(41,230,178,0.3)] transition-all cursor-pointer"
                >
                  <UserCheck className="size-3.5 stroke-[2.5]" />
                  ยืนยันอีเมลแอดมิน
                </button>
              </div>
            </form>

            {/* Quick 1-click Toggle Section */}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#29e6b2] bg-[#29e6b2]/10 border border-[#29e6b2]/20 hover:bg-[#29e6b2]/20 transition-all cursor-pointer"
              >
                <span>⚡ เข้าสู่ระบบทันทีในฐานะ {AUTHORIZED_ADMIN_EMAIL}</span>
              </button>

              <button
                type="button"
                onClick={handleGuestToggle}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/50 bg-white/[0.02] border border-white/5 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <Eye className="size-3.5" />
                <span>สลับเป็นโหมดผู้ชม (จำลองมุมมองบุคคลภายนอก)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
