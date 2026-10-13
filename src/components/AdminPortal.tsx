import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Plus,
  Edit3,
  Trash2,
  Cloud,
  RotateCw,
  LogOut,
  ExternalLink,
  Flame,
  Search,
  Check,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { RedeemCode } from '../types/code';
import { AUTHORIZED_ADMIN_EMAIL } from '../types/auth';
import { AddCodeModal } from './AddCodeModal';
import { EditCodeModal } from './EditCodeModal';
import { CloudflareModal } from './CloudflareModal';
import {
  fetchServerCodes,
  saveServerCode,
  updateServerCode,
  deleteServerCode,
  fetchCloudflareStatus
} from '../services/codeApiService';
import { sortCodesByNewest } from '../services/codeSyncService';

interface AdminPortalProps {
  onNavigateHome: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onNavigateHome }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('opm_admin_authenticated') === 'true';
  });
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Codes State
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<RedeemCode | null>(null);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isCloudflareConnected, setIsCloudflareConnected] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load codes
  const loadCodes = async () => {
    setIsLoading(true);
    try {
      const serverCodes = await fetchServerCodes();
      if (serverCodes) {
        setCodes(sortCodesByNewest(serverCodes));
      }
      const cfStatus = await fetchCloudflareStatus();
      setIsCloudflareConnected(!!cfStatus?.isConnected);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCodes();
    }
  }, [isAuthenticated]);

  // Login Handler (The secret password is the admin email, no hints given)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = secretKeyInput.trim();
    if (cleanInput.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      setIsAuthenticated(true);
      localStorage.setItem('opm_admin_authenticated', 'true');
      setAuthError(null);
      setSecretKeyInput('');
      showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ');
    } else {
      setAuthError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('opm_admin_authenticated');
    setSecretKeyInput('');
    setAuthError(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  // Add Code
  const handleAddCode = async (newCodeData: Omit<RedeemCode, 'id'>) => {
    const newCode: RedeemCode = {
      ...newCodeData,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      addedAt: newCodeData.addedAt || 'เพิ่งเพิ่ม',
      addedAtTimestamp: Date.now(),
    };
    const res = await saveServerCode(newCode, AUTHORIZED_ADMIN_EMAIL);
    if (res.success) {
      setCodes((prev) => sortCodesByNewest([newCode, ...prev.filter((c) => c.code !== newCode.code)]));
      setIsAddModalOpen(false);
      showToast(`เพิ่มโค้ด [${newCode.code}] สำเร็จและอัปเดตไปยังเว็บผู้เล่นแล้ว!`);
    } else {
      showToast(res.error || 'เกิดข้อผิดพลาดในการเพิ่มโค้ด');
    }
  };

  // Edit Code
  const handleSaveEdit = async (updated: RedeemCode) => {
    const res = await updateServerCode(updated, AUTHORIZED_ADMIN_EMAIL);
    if (res) {
      setCodes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCode(null);
      showToast(`บันทึกโค้ด [${updated.code}] เรียบร้อย!`);
    }
  };

  // Delete Code
  const handleDeleteCode = async (id: string, codeStr: string) => {
    if (!window.confirm(`ยืนยันการลบโค้ด [${codeStr}] หรือไม่? ผู้เล่นจะไม่เห็นโค้ดนี้อีกต่อไป`)) {
      return;
    }
    const success = await deleteServerCode(id, AUTHORIZED_ADMIN_EMAIL);
    if (success) {
      setCodes((prev) => prev.filter((c) => c.id !== id));
      showToast(`ลบโค้ด [${codeStr}] เรียบร้อยแล้ว`);
    }
  };

  // Toggle Code Status (ACTIVE <-> EXPIRED)
  const handleToggleStatus = async (id: string) => {
    const target = codes.find((c) => c.id === id);
    if (!target) return;
    const newStatus = target.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
    const updated: RedeemCode = {
      ...target,
      status: newStatus,
      isNew: newStatus === 'ACTIVE' ? target.isNew : false,
    };
    const res = await updateServerCode(updated, AUTHORIZED_ADMIN_EMAIL);
    if (res) {
      setCodes((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(`เปลี่ยนสถานะโค้ด [${target.code}] เป็น ${newStatus === 'ACTIVE' ? 'ใช้งานได้' : 'หมดอายุ'}`);
    }
  };

  // Filtered codes
  const filteredCodes = codes.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rewards.some((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? c.status === 'ACTIVE'
        : c.status === 'EXPIRED';
    return matchesSearch && matchesStatus;
  });

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080a] text-white flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#0f1115] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              <span>กลับสู่หน้าผู้เล่น</span>
            </button>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
              Admin Only
            </span>
          </div>

          <div className="text-center mb-6">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-[#29e6b2] to-[#149974] mx-auto flex items-center justify-center shadow-[0_0_24px_rgba(41,230,178,0.35)] mb-3">
              <ShieldCheck className="size-7 text-black stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              ONE PUNCH <span className="text-[#29e6b2]">ADMIN</span>
            </h1>
            <p className="text-xs text-white/50 mt-1">
              แผงควบคุมหลังบ้านสำหรับเพิ่มและแก้ไขโค้ดเกม
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-400 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                รหัสผ่านเข้าสู่ระบบ (Security Key)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  placeholder="กรอกรหัสผ่านเพื่อเข้าใช้งาน..."
                  required
                  autoFocus
                  className="w-full bg-[#181a20] border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#29e6b2] focus:ring-1 focus:ring-[#29e6b2]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#29e6b2] text-black font-bold text-sm shadow-[0_0_20px_rgba(41,230,178,0.4)] hover:bg-[#34f0bd] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="size-4 stroke-[2.2]" />
              <span>เข้าสู่ระบบหลังบ้าน</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
            <p className="text-[11px] text-white/30">
              ระบบป้องกันการเข้าถึงเฉพาะผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col font-['Kanit','Plus_Jakarta_Sans',sans-serif]">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-[#0e1014]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-all cursor-pointer"
              title="สลับไปหน้าเว็บผู้เล่นเพื่อดูตัวอย่าง"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">ดูหน้าผู้เล่น</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-to-br from-[#29e6b2] to-[#149974] flex items-center justify-center font-black text-black text-xs shadow-[0_0_12px_rgba(41,230,178,0.3)]">
                ADM
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white">
                    ONE PUNCH <span className="text-[#29e6b2]">ADMIN HUB</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Admin Controls */}
          <div className="flex items-center gap-2">
            {/* Cloudflare Edge Sync */}
            <button
              onClick={() => setIsCloudflareModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isCloudflareConnected
                  ? 'border-[#F38020]/40 bg-[#F38020]/10 text-[#FAAD3F]'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white'
              }`}
            >
              <Cloud className="size-3.5 text-[#FAAD3F]" />
              <span className="hidden md:inline">Cloudflare Edge</span>
            </button>

            {/* Add Code Primary Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#29e6b2] text-black shadow-[0_0_14px_rgba(41,230,178,0.35)] hover:bg-[#34f0bd] active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>เพิ่มโค้ดใหม่</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="ออกจากระบบแอดมิน"
            >
              <LogOut className="size-3.5 text-red-400" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex-1">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-[#0f1115] border border-white/[0.08]">
            <p className="text-xs text-white/50 font-medium">โค้ดทั้งหมด</p>
            <p className="text-2xl font-black text-white mt-1">{codes.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0f1115] border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-medium">ใช้งานได้ (ACTIVE)</p>
            <p className="text-2xl font-black text-emerald-300 mt-1">
              {codes.filter((c) => c.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0f1115] border border-white/[0.08]">
            <p className="text-xs text-white/40 font-medium">หมดอายุ (EXPIRED)</p>
            <p className="text-2xl font-black text-white/40 mt-1">
              {codes.filter((c) => c.status === 'EXPIRED').length}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#0f1115] border border-[#29e6b2]/20">
            <p className="text-xs text-[#29e6b2] font-medium">โค้ดมาใหม่ (NEW)</p>
            <p className="text-2xl font-black text-[#29e6b2] mt-1">
              {codes.filter((c) => c.isNew && c.status === 'ACTIVE').length}
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Filters & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-[#0f1115] border border-white/[0.08] p-3 rounded-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="size-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาโค้ด, ของรางวัล หรือคำอธิบาย..."
              className="w-full bg-[#16181d] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#29e6b2]"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#16181d] p-1 rounded-xl border border-white/10">
            {(['ALL', 'ACTIVE', 'EXPIRED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-[#29e6b2] text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {filter === 'ALL' ? 'ทั้งหมด' : filter === 'ACTIVE' ? 'ใช้งานได้' : 'หมดอายุ'}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={loadCodes}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium transition-all cursor-pointer"
            title="โหลดข้อมูลล่าสุด"
          >
            <RotateCw className="size-3.5" />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>

        {/* Codes Table / Cards */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="size-8 border-2 border-[#29e6b2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-white/50">กำลังโหลดโค้ด...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-16 bg-[#0f1115] border border-white/[0.08] rounded-2xl p-8">
            <Flame className="size-10 text-white/20 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white/70">ไม่พบโค้ดในหมวดนี้</p>
            <p className="text-xs text-white/40 mt-1">กดปุ่ม "เพิ่มโค้ดใหม่" ด้านบนเพื่อเริ่มเพิ่มโค้ดเข้าสู่ระบบ</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#29e6b2] text-black font-bold text-xs shadow-md cursor-pointer hover:bg-[#34f0bd]"
            >
              + เพิ่มโค้ดแรกตอนนี้
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCodes.map((code) => {
              const isActive = code.status === 'ACTIVE';
              return (
                <div
                  key={code.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-[#0f1115] border-white/[0.08] hover:border-[#29e6b2]/30'
                      : 'bg-[#0a0b0d] border-white/[0.04] opacity-70'
                  }`}
                >
                  {/* Code Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-base font-black font-mono tracking-wider text-white bg-black/60 px-3 py-1 rounded-lg border border-white/10 select-all">
                        {code.code}
                      </span>

                      {/* Status Badge */}
                      <button
                        onClick={() => handleToggleStatus(code.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                        }`}
                        title="คลิกเพื่อสลับสถานะ"
                      >
                        {isActive ? '● ใช้งานได้ (คลิกเพื่อเปลี่ยน)' : '✕ หมดอายุ (คลิกเพื่อเปลี่ยน)'}
                      </button>

                      {code.isNew && isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#29e6b2]/20 text-[#29e6b2] border border-[#29e6b2]/40 flex items-center gap-1">
                          <Sparkles className="size-3" />
                          NEW
                        </span>
                      )}

                      <span className="text-[10px] text-white/40">
                        เซิร์ฟเวอร์: {code.server}
                      </span>
                    </div>

                    {/* Rewards list */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {code.rewards.map((reward, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded-md text-white/80"
                        >
                          {reward.icon} {reward.name} {reward.amount && `x${reward.amount}`}
                        </span>
                      ))}
                    </div>

                    {code.description && (
                      <p className="text-xs text-white/40 mt-1.5 italic">
                        {code.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => setEditingCode(code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/12 border border-white/10 text-xs font-semibold text-white/90 transition-all cursor-pointer"
                    >
                      <Edit3 className="size-3.5 text-[#29e6b2]" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      onClick={() => handleDeleteCode(code.id, code.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-300 transition-all cursor-pointer"
                    >
                      <Trash2 className="size-3.5 text-red-400" />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddCodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCode={handleAddCode}
      />

      <EditCodeModal
        isOpen={!!editingCode}
        code={editingCode}
        onClose={() => setEditingCode(null)}
        onSave={handleSaveEdit}
      />

      <CloudflareModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        currentUserEmail={AUTHORIZED_ADMIN_EMAIL}
        onSyncComplete={() => {
          loadCodes();
          showToast('ซิงค์ข้อมูลกับ Cloudflare เรียบร้อยแล้ว!');
        }}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/95 text-white border border-[#29e6b2]/40 shadow-2xl text-xs font-semibold backdrop-blur-xl"
            >
              <Sparkles className="size-3.5 text-[#29e6b2]" />
              <span>{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
