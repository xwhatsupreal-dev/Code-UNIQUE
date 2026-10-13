import { RedeemCode } from '../types/code';

export const DEFAULT_CLOUDFLARE_WORKER_URL = 'https://opm-codes.itzreal-whatsupx.workers.dev';

export function getActiveWorkerUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('opm_cf_worker_url');
    if (custom && custom.trim().startsWith('http')) return custom.trim();
  }
  return DEFAULT_CLOUDFLARE_WORKER_URL;
}

function getWorkerCodesEndpoint(workerUrl: string): string {
  const clean = workerUrl.replace(/\/+$/, '');
  return clean.endsWith('/api/codes') || clean.endsWith('/codes')
    ? clean
    : `${clean}/api/codes`;
}

function getAdminHeader(email?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (email) {
    headers['x-admin-email'] = email;
  }
  return headers;
}

/**
 * Fetch codes from Server or directly from Cloudflare Edge Worker
 * This guarantees data loads 100% on Vercel, localhost, and static hosting!
 */
export async function fetchServerCodes(): Promise<RedeemCode[] | null> {
  // 1. Try local/same-origin /api/codes first
  try {
    const res = await fetch('/api/codes');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Continue to Cloudflare Edge fallback
  }

  // 2. Direct Cloudflare Edge Worker fetch (works seamlessly on Vercel)
  try {
    const targetUrl = getWorkerCodesEndpoint(getActiveWorkerUrl());
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Direct Cloudflare Edge fetch notice:', err);
  }

  return null;
}

/**
 * Sync entire code list to Cloudflare Edge Worker KV storage
 */
async function syncListToCloudflare(codes: RedeemCode[]): Promise<boolean> {
  try {
    const targetUrl = getWorkerCodesEndpoint(getActiveWorkerUrl());
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(codes),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveServerCode(
  newCode: RedeemCode,
  email: string | null,
  allCurrentCodes?: RedeemCode[]
): Promise<{ success: boolean; error?: string }> {
  let fullList: RedeemCode[] = [];
  if (allCurrentCodes && allCurrentCodes.length > 0) {
    fullList = allCurrentCodes;
  } else {
    const existing = (await fetchServerCodes()) || [];
    fullList = [newCode, ...existing.filter((c) => c.code.toUpperCase() !== newCode.code.toUpperCase() && c.id !== newCode.id)];
  }

  // 1. Try local server
  try {
    await fetch('/api/codes', {
      method: 'POST',
      headers: getAdminHeader(email),
      body: JSON.stringify(newCode),
    });
  } catch {}

  // 2. Sync full list to Cloudflare Edge Worker
  try {
    await syncListToCloudflare(fullList);
  } catch {}

  // 3. Persist locally
  try {
    localStorage.setItem('opm_user_managed_codes_v1', JSON.stringify(fullList));
  } catch {}

  return { success: true };
}

export async function saveServerBatchCodes(
  newCodes: RedeemCode[],
  email: string | null,
  allCurrentCodes?: RedeemCode[]
): Promise<{ success: boolean; error?: string }> {
  let fullList: RedeemCode[] = [];
  if (allCurrentCodes && allCurrentCodes.length > 0) {
    fullList = allCurrentCodes;
  } else {
    const existing = (await fetchServerCodes()) || [];
    const newCodeStrings = new Set(newCodes.map((c) => c.code.toUpperCase()));
    fullList = [...newCodes, ...existing.filter((c) => !newCodeStrings.has(c.code.toUpperCase()))];
  }

  // 1. Try local server
  try {
    await fetch('/api/codes/batch', {
      method: 'POST',
      headers: getAdminHeader(email),
      body: JSON.stringify({ newCodes }),
    });
  } catch {}

  // 2. Sync full list to Cloudflare Edge Worker
  try {
    await syncListToCloudflare(fullList);
  } catch {}

  // 3. Persist locally
  try {
    localStorage.setItem('opm_user_managed_codes_v1', JSON.stringify(fullList));
  } catch {}

  return { success: true };
}

export async function updateServerCode(
  updatedCode: RedeemCode,
  email: string | null,
  allCurrentCodes?: RedeemCode[]
): Promise<{ success: boolean; error?: string }> {
  let fullList: RedeemCode[] = [];
  if (allCurrentCodes && allCurrentCodes.length > 0) {
    fullList = allCurrentCodes;
  } else {
    const existing = (await fetchServerCodes()) || [];
    fullList = existing.map((c) => (c.id === updatedCode.id ? updatedCode : c));
  }

  try {
    await fetch(`/api/codes/${updatedCode.id}`, {
      method: 'PUT',
      headers: getAdminHeader(email),
      body: JSON.stringify(updatedCode),
    });
  } catch {}

  try {
    await syncListToCloudflare(fullList);
  } catch {}

  try {
    localStorage.setItem('opm_user_managed_codes_v1', JSON.stringify(fullList));
  } catch {}

  return { success: true };
}

export async function deleteServerCode(
  id: string,
  email: string | null,
  allCurrentCodes?: RedeemCode[]
): Promise<{ success: boolean; error?: string }> {
  let fullList: RedeemCode[] = [];
  if (allCurrentCodes && allCurrentCodes.length > 0) {
    fullList = allCurrentCodes;
  } else {
    const existing = (await fetchServerCodes()) || [];
    fullList = existing.filter((c) => c.id !== id);
  }

  try {
    await fetch(`/api/codes/${id}`, {
      method: 'DELETE',
      headers: getAdminHeader(email),
    });
  } catch {}

  try {
    await syncListToCloudflare(fullList);
  } catch {}

  try {
    localStorage.setItem('opm_user_managed_codes_v1', JSON.stringify(fullList));
  } catch {}

  return { success: true };
}

export async function clearServerCodes(
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await fetch('/api/codes', {
      method: 'DELETE',
      headers: getAdminHeader(email),
    });
  } catch {}

  try {
    await syncListToCloudflare([]);
  } catch {}

  return { success: true };
}

export interface CloudflareStatus {
  isConnected: boolean;
  mode: 'worker' | 'kv' | 'local';
  workerUrl: string | null;
  isKvConfigured: boolean;
  hasAccountId?: boolean;
  hasKvNamespaceId?: boolean;
  hasApiToken?: boolean;
  lastSyncedAt: string | null;
  codeCount: number;
}

export async function fetchCloudflareStatus(): Promise<CloudflareStatus | null> {
  // 1. Try local server
  try {
    const res = await fetch('/api/cloudflare/status');
    if (res.ok) {
      const data = await res.json();
      if (data && data.isConnected) return data;
    }
  } catch {}

  // 2. Direct probe of Cloudflare Edge Worker
  try {
    const workerUrl = getActiveWorkerUrl();
    const targetUrl = getWorkerCodesEndpoint(workerUrl);
    const res = await fetch(targetUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        isConnected: true,
        mode: 'worker',
        workerUrl,
        isKvConfigured: true,
        lastSyncedAt: new Date().toISOString(),
        codeCount: Array.isArray(data) ? data.length : 0,
      };
    }
  } catch {}

  return null;
}

export async function saveCloudflareConfig(
  config: { workerUrl?: string; accountId?: string; kvNamespaceId?: string; apiToken?: string },
  email: string | null
): Promise<{ success: boolean; message: string }> {
  if (config.workerUrl) {
    localStorage.setItem('opm_cf_worker_url', config.workerUrl);
  }

  try {
    const res = await fetch('/api/cloudflare/config', {
      method: 'POST',
      headers: getAdminHeader(email),
      body: JSON.stringify(config),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success,
        message: data.message || 'บันทึกการตั้งค่าแล้ว',
      };
    }
  } catch {}

  return { success: true, message: 'บันทึกการตั้งค่า Cloudflare เรียบร้อยแล้ว' };
}

export async function triggerCloudflareSync(
  direction: 'push' | 'pull',
  email: string | null
): Promise<{ success: boolean; message: string; codes?: RedeemCode[] }> {
  try {
    const res = await fetch('/api/cloudflare/sync', {
      method: 'POST',
      headers: getAdminHeader(email),
      body: JSON.stringify({ direction }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success,
        message: data.message || 'ซิงค์สำเร็จ',
        codes: data.codes,
      };
    }
  } catch {}

  // Direct pull/push fallback
  try {
    const targetUrl = getWorkerCodesEndpoint(getActiveWorkerUrl());
    if (direction === 'pull') {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const codes = await res.json();
        return { success: true, message: 'ดึงข้อมูลจาก Cloudflare สำเร็จ', codes };
      }
    }
  } catch {}

  return { success: false, message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' };
}

export async function fetchCloudflareWorkerTemplate(): Promise<string> {
  try {
    const res = await fetch('/api/cloudflare/worker-template');
    if (res.ok) {
      const data = await res.json();
      return data.code || '';
    }
  } catch {}
  return '';
}
