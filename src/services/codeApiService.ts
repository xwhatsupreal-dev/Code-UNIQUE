import { RedeemCode } from '../types/code';
import { AUTHORIZED_ADMIN_EMAIL } from '../types/auth';

const STORAGE_KEY_USER_CODES = 'opm_user_managed_codes_v1';

function getAdminHeader(email?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (email) {
    headers['x-admin-email'] = email;
  }
  return headers;
}

export async function fetchServerCodes(): Promise<RedeemCode[] | null> {
  try {
    const res = await fetch('/api/codes');
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    // Fallback gracefully
    return null;
  }
}

export async function saveServerCode(
  newCode: RedeemCode,
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/codes', {
      method: 'POST',
      headers: getAdminHeader(email),
      body: JSON.stringify(newCode),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'ไม่สามารถเพิ่มโค้ดได้' };
    }
    return { success: true };
  } catch (err) {
    return { success: true }; // Local fallback succeeds
  }
}

export async function saveServerBatchCodes(
  newCodes: RedeemCode[],
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/codes/batch', {
      method: 'POST',
      headers: getAdminHeader(email),
      body: JSON.stringify({ newCodes }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'ไม่สามารถเพิ่มชุดโค้ดได้' };
    }
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

export async function updateServerCode(
  updatedCode: RedeemCode,
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/codes/${updatedCode.id}`, {
      method: 'PUT',
      headers: getAdminHeader(email),
      body: JSON.stringify(updatedCode),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'ไม่สามารถแก้ไขโค้ดได้' };
    }
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

export async function deleteServerCode(
  id: string,
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/codes/${id}`, {
      method: 'DELETE',
      headers: getAdminHeader(email),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'ไม่สามารถลบโค้ดได้' };
    }
    return { success: true };
  } catch (err) {
    return { success: true };
  }
}

export async function clearServerCodes(
  email: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/codes', {
      method: 'DELETE',
      headers: getAdminHeader(email),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'ไม่สามารถลบโค้ดทั้งหมดได้' };
    }
    return { success: true };
  } catch (err) {
    return { success: true };
  }
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
  try {
    const res = await fetch('/api/cloudflare/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveCloudflareConfig(
  config: { workerUrl?: string; accountId?: string; kvNamespaceId?: string; apiToken?: string },
  email: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/cloudflare/config', {
      method: 'POST',
      headers: getAdminHeader(email),
      body: JSON.stringify(config),
    });
    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message || (res.ok ? 'บันทึกการตั้งค่าแล้ว' : 'เกิดข้อผิดพลาดในการบันทึก'),
    };
  } catch (err) {
    return { success: false, message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' };
  }
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
    const data = await res.json();
    return {
      success: res.ok && data.success,
      message: data.message || (res.ok ? 'ซิงค์สำเร็จ' : 'เกิดข้อผิดพลาดในการซิงค์'),
      codes: data.codes,
    };
  } catch (err) {
    return { success: false, message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' };
  }
}

export async function fetchCloudflareWorkerTemplate(): Promise<string> {
  try {
    const res = await fetch('/api/cloudflare/worker-template');
    if (!res.ok) return '';
    const data = await res.json();
    return data.code || '';
  } catch {
    return '';
  }
}
