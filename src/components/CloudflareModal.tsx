import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  Zap,
  Globe,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  CloudflareStatus,
  fetchCloudflareStatus,
  saveCloudflareConfig,
  triggerCloudflareSync,
  fetchCloudflareWorkerTemplate,
} from '../services/codeApiService';
import { AUTHORIZED_ADMIN_EMAIL } from '../types/auth';

interface CloudflareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string | null;
  onSyncComplete?: () => void;
}

export const CloudflareModal: React.FC<CloudflareModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onSyncComplete,
}) => {
  const [status, setStatus] = useState<CloudflareStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [workerUrl, setWorkerUrl] = useState('');
  const [accountId, setAccountId] = useState('');
  const [kvNamespaceId, setKvNamespaceId] = useState('');
  const [apiToken, setApiToken] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [workerCode, setWorkerCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide'>('config');

  const isAdmin = (currentUserEmail || '').toLowerCase().trim() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  // Load status and worker template on open
  useEffect(() => {
    if (isOpen && isAdmin) {
      loadStatus();
      loadTemplate();
    }
  }, [isOpen, isAdmin]);

  // Auto-save Worker URL with debounce when user pastes or types a valid URL
  useEffect(() => {
    if (!isOpen || !isAdmin || !workerUrl) return;
    const trimmed = workerUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return;

    // Do not re-save if it's already the connected workerUrl
    if (status?.workerUrl === trimmed && status?.isConnected) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      setFeedback(null);
      try {
        const res = await saveCloudflareConfig(
          {
            workerUrl: trimmed,
            accountId: accountId.trim(),
            kvNamespaceId: kvNamespaceId.trim(),
            apiToken: apiToken.trim(),
          },
          currentUserEmail
        );

        if (res.success) {
          setFeedback({ type: 'success', message: '⚡ บันทึกและเชื่อมต่ออัตโนมัติสำเร็จเรียบร้อย!' });
          await loadStatus();
          if (onSyncComplete) onSyncComplete();
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      } catch {
        setFeedback({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกอัตโนมัติ' });
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [workerUrl, isOpen, isAdmin]);

  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const data = await fetchCloudflareStatus();
      if (data) {
        setStatus(data);
        if (data.workerUrl) setWorkerUrl(data.workerUrl);
      }
    } finally {
      setLoadingStatus(false);
    }
  }

  async function loadTemplate() {
    const code = await fetchCloudflareWorkerTemplate();
    setWorkerCode(code);
  }

  async function handleSaveConfig(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await saveCloudflareConfig(
        {
          workerUrl: workerUrl.trim(),
          accountId: accountId.trim(),
          kvNamespaceId: kvNamespaceId.trim(),
          apiToken: apiToken.trim(),
        },
        currentUserEmail
      );

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await loadStatus();
        if (onSyncComplete) onSyncComplete();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleManualSync(direction: 'push' | 'pull') {
    if (!isAdmin || isSyncing) return;
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await triggerCloudflareSync(direction, currentUserEmail);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await loadStatus();
        if (onSyncComplete) onSyncComplete();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'เกิดข้อผิดพลาดในการซิงค์' });
    } finally {
      setIsSyncing(false);
    }
  }

  function handleCopyWorkerCode() {
    if (!workerCode) return;
    navigator.clipboard.writeText(workerCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  if (!isOpen || !isAdmin) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-2xl bg-[#0c0f17] border border-[#F38020]/30 rounded-2xl shadow-[0_0_50px_rgba(243,128,32,0.2)] overflow-hidden z-10 my-6"
        >
          {/* Header Banner */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-r from-[#171412] via-[#1a130f] to-[#0c0f17] border-b border-[#F38020]/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-gradient-to-br from-[#F38020] to-[#FAAD3F] p-0.5 shadow-[0_0_20px_rgba(243,128,32,0.4)] flex items-center justify-center">
                  <div className="size-full bg-black/40 rounded-[10px] flex items-center justify-center">
                    <Cloud className="size-6 text-[#FAAD3F]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                      Cloudflare Edge Storage
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F38020]/20 text-[#FAAD3F] border border-[#F38020]/40 uppercase">
                      Global Edge
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    บันทึกโค้ดบน Cloudflare Edge ให้ผู้เล่นทั่วโลกสามารถเปิดและคัดลอกไปรีดีมได้ทันที
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="size-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Status Pill Card */}
            <div className="mt-4 p-3 rounded-xl bg-black/60 border border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`size-2.5 rounded-full animate-pulse ${
                    status?.isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-amber-400'
                  }`}
                />
                <div className="text-xs">
                  <span className="font-bold text-white">
                    {status?.isConnected
                      ? `เชื่อมต่อ Cloudflare Edge (${status.mode === 'worker' ? 'Worker API' : 'KV Direct'})`
                      : 'จัดเก็บในเซิร์ฟเวอร์หลัก (พร้อมเชื่อม Cloudflare)'}
                  </span>
                  <span className="text-white/40 block text-[11px]">
                    จำนวนโค้ดในระบบ: {status?.codeCount ?? 0} โค้ด
                    {status?.lastSyncedAt && ` • ซิงค์ล่าสุด: ${new Date(status.lastSyncedAt).toLocaleTimeString('th-TH')}`}
                  </span>
                </div>
              </div>

              {status?.isConnected && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleManualSync('push')}
                    disabled={isSyncing}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#F38020]/20 hover:bg-[#F38020]/30 text-[#FAAD3F] border border-[#F38020]/30 transition-all cursor-pointer disabled:opacity-50"
                    title="ส่งโค้ดทั้งหมดไปยัง Cloudflare"
                  >
                    <UploadCloud className="size-3" />
                    <span>Push โค้ด</span>
                  </button>
                  <button
                    onClick={() => handleManualSync('pull')}
                    disabled={isSyncing}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.05] hover:bg-white/[0.1] text-white/80 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                    title="ดึงโค้ดล่าสุดจาก Cloudflare"
                  >
                    <DownloadCloud className="size-3" />
                    <span>Pull โค้ด</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 sm:px-6 pt-3 border-b border-white/[0.08] flex items-center gap-3">
            <button
              onClick={() => setActiveTab('config')}
              className={`pb-2.5 text-xs font-bold transition-colors relative cursor-pointer ${
                activeTab === 'config' ? 'text-[#FAAD3F]' : 'text-white/60 hover:text-white'
              }`}
            >
              ตั้งค่าการเชื่อมต่อ (Settings)
              {activeTab === 'config' && (
                <motion.div
                  layoutId="cfTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FAAD3F]"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 text-xs font-bold transition-colors relative cursor-pointer ${
                activeTab === 'guide' ? 'text-[#FAAD3F]' : 'text-white/60 hover:text-white'
              }`}
            >
              วิธีสร้าง Cloudflare Worker ฟรี (โค้ดพร้อมใช้)
              {activeTab === 'guide' && (
                <motion.div
                  layoutId="cfTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FAAD3F]"
                />
              )}
            </button>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div
              className={`mx-5 sm:mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Content Body */}
          <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {activeTab === 'config' ? (
              <form onSubmit={handleSaveConfig} className="space-y-4">
                {/* Mode 1: Cloudflare Worker URL (Recommended) */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-[#F38020]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="size-4 text-[#FAAD3F]" />
                      <span className="text-xs font-bold text-white">
                        วิธีที่ 1: ใส่ Cloudflare Worker URL (แนะนำ ง่ายที่สุด)
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ฟรี 100,000 ครั้ง/วัน
                    </span>
                  </div>

                  <p className="text-[11px] text-white/60">
                    หากคุณมี Cloudflare Worker ที่สร้างไว้ นำ URL มาวางที่นี่เพื่อเชื่อมต่อทันที
                  </p>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-white/70">
                        Cloudflare Worker URL
                      </label>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        ✨ บันทึกและทดสอบเชื่อมต่อให้อัตโนมัติทันทีที่วาง
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={workerUrl}
                        onChange={(e) => setWorkerUrl(e.target.value)}
                        placeholder="https://opm-codes.yoursubdomain.workers.dev"
                        className="w-full h-10 px-3 bg-black/60 border border-white/[0.12] focus:border-[#FAAD3F] rounded-xl text-xs text-white placeholder-white/20 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Mode 2: Cloudflare KV Direct API */}
                <details className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                  <summary className="text-xs font-bold text-white/80 cursor-pointer list-none flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Globe className="size-4 text-white/50" />
                      วิธีที่ 2: ใช้ Cloudflare KV REST API โดยตรง (ตัวเลือกเสริม)
                    </span>
                    <span className="text-[10px] text-white/40 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>

                  <div className="mt-3 space-y-3 pt-3 border-t border-white/[0.06]">
                    <div>
                      <label className="block text-[11px] font-medium text-white/60 mb-1">
                        Account ID
                      </label>
                      <input
                        type="text"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        placeholder="Cloudflare Account ID (32 ตัวอักษร)"
                        className="w-full h-9 px-3 bg-black/60 border border-white/[0.1] focus:border-[#FAAD3F] rounded-lg text-xs text-white placeholder-white/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-white/60 mb-1">
                        KV Namespace ID
                      </label>
                      <input
                        type="text"
                        value={kvNamespaceId}
                        onChange={(e) => setKvNamespaceId(e.target.value)}
                        placeholder="KV Namespace ID"
                        className="w-full h-9 px-3 bg-black/60 border border-white/[0.1] focus:border-[#FAAD3F] rounded-lg text-xs text-white placeholder-white/20 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-white/60 mb-1">
                        API Token
                      </label>
                      <input
                        type="password"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder="Cloudflare API Token (สิทธิ์ Workers KV Storage: Edit)"
                        className="w-full h-9 px-3 bg-black/60 border border-white/[0.1] focus:border-[#FAAD3F] rounded-lg text-xs text-white placeholder-white/20 outline-none"
                      />
                    </div>
                  </div>
                </details>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#F38020] to-[#FAAD3F] text-black shadow-[0_0_15px_rgba(243,128,32,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        <span>กำลังทดสอบและบันทึก...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5 stroke-[3]" />
                        <span>บันทึกและเชื่อมต่อ Cloudflare</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Guide & Worker Code Tab */
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#F38020]/10 border border-[#F38020]/30 text-xs text-white/90 space-y-2">
                  <div className="font-bold text-[#FAAD3F] flex items-center gap-1.5">
                    <HelpCircle className="size-4" />
                    <span>ขั้นตอนสร้าง Cloudflare Worker ฟรีใน 1 นาที:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-white/80 leading-relaxed">
                    <li>
                      เปิดเว็บ{' '}
                      <a
                        href="https://dash.cloudflare.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#FAAD3F] underline inline-flex items-center gap-0.5"
                      >
                        dash.cloudflare.com <ExternalLink className="size-2.5" />
                      </a>{' '}
                      และเข้าเมนู <strong>Workers & Pages</strong>
                    </li>
                    <li>กด <strong>Create Application</strong> แล้วเลือก <strong>Create Worker</strong></li>
                    <li>กด <strong>Deploy</strong> จากนั้นกด <strong>Edit Code</strong></li>
                    <li>กดปุ่ม <strong>"คัดลอกโค้ด Worker"</strong> ด้านล่างนี้ แล้วนำไปวางแทนที่โค้ดเดิมทั้งหมด</li>
                    <li>
                      (แนะนำ) ไปที่ <strong>Settings &gt; Variables &gt; KV Namespace Bindings</strong> ผูก KV ชื่อ{' '}
                      <code className="text-[#FAAD3F] bg-black/40 px-1 py-0.5 rounded">OPM_KV</code>
                    </li>
                    <li>กด <strong>Deploy</strong> แล้วนำ Worker URL มาใส่ในแท็บการตั้งค่า</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/80">โค้ด Cloudflare Worker (worker.js)</span>
                    <button
                      onClick={handleCopyWorkerCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F38020] text-black hover:bg-[#FAAD3F] transition-all cursor-pointer shadow-[0_0_10px_rgba(243,128,32,0.3)]"
                    >
                      {copiedCode ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      <span>{copiedCode ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด Worker'}</span>
                    </button>
                  </div>

                  <pre className="p-3 bg-black/80 border border-white/[0.08] rounded-xl text-[10px] text-emerald-300/90 font-mono overflow-x-auto max-h-56 leading-relaxed">
                    {workerCode || '// กำลังโหลดโค้ด Cloudflare Worker...'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-4 bg-black/60 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-white/50">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>ความปลอดภัย: จำกัดสิทธิ์เฉพาะผู้ดูแลระบบที่ได้รับอนุญาต</span>
            </span>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors cursor-pointer text-xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
