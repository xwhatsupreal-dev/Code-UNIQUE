import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_EMAIL = 'teerasit.thanwa@gmail.com';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'codes.json');
const CF_CONFIG_FILE = path.resolve(DATA_DIR, 'cloudflare-config.json');
const WORKER_SCRIPT_FILE = path.resolve(process.cwd(), 'cloudflare-worker', 'worker.js');

app.use(express.json());

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

interface CloudflareConfig {
  workerUrl?: string;
  accountId?: string;
  kvNamespaceId?: string;
  apiToken?: string;
  lastSyncedAt?: string;
  autoSync?: boolean;
}

function readCodes(): any[] {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading codes.json:', err);
    return [];
  }
}

function writeCodes(codes: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(codes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing codes.json:', err);
  }
}

function getCloudflareConfig(): CloudflareConfig {
  let fileConfig: CloudflareConfig = {};
  try {
    if (fs.existsSync(CF_CONFIG_FILE)) {
      fileConfig = JSON.parse(fs.readFileSync(CF_CONFIG_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading cloudflare-config.json:', err);
  }

  // Environment variables override file config if present
  return {
    workerUrl: process.env.CLOUDFLARE_WORKER_URL || fileConfig.workerUrl || '',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || fileConfig.accountId || '',
    kvNamespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID || fileConfig.kvNamespaceId || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || fileConfig.apiToken || '',
    lastSyncedAt: fileConfig.lastSyncedAt || '',
    autoSync: fileConfig.autoSync ?? true,
  };
}

function saveCloudflareConfig(config: CloudflareConfig) {
  try {
    fs.writeFileSync(CF_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving cloudflare-config.json:', err);
  }
}

/**
 * Push codes to Cloudflare (Worker or KV REST API)
 */
async function pushCodesToCloudflare(codes: any[]): Promise<{ success: boolean; message: string }> {
  const config = getCloudflareConfig();

  // 1. Check Worker URL first
  if (config.workerUrl) {
    try {
      const cleanUrl = config.workerUrl.replace(/\/+$/, '');
      const targetUrl = cleanUrl.endsWith('/api/codes') || cleanUrl.endsWith('/codes')
        ? cleanUrl
        : `${cleanUrl}/api/codes`;

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': ADMIN_EMAIL,
        },
        body: JSON.stringify(codes),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `Cloudflare Worker ตอบกลับสถานะ ${res.status}: ${text}` };
      }

      // Update sync timestamp
      config.lastSyncedAt = new Date().toISOString();
      saveCloudflareConfig(config);
      return { success: true, message: 'บันทึกโค้ดไปยัง Cloudflare Worker เรียบร้อยแล้ว' };
    } catch (err) {
      return { success: false, message: `ไม่สามารถเชื่อมต่อ Cloudflare Worker ได้: ${String(err)}` };
    }
  }

  // 2. Check KV Direct REST API
  if (config.accountId && config.kvNamespaceId && config.apiToken) {
    try {
      const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/kv/namespaces/${config.kvNamespaceId}/values/opm_redeem_codes_v1`;
      const res = await fetch(kvUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(codes),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `Cloudflare KV API ตอบกลับสถานะ ${res.status}: ${text}` };
      }

      config.lastSyncedAt = new Date().toISOString();
      saveCloudflareConfig(config);
      return { success: true, message: 'บันทึกโค้ดไปยัง Cloudflare KV เรียบร้อยแล้ว' };
    } catch (err) {
      return { success: false, message: `ไม่สามารถเชื่อมต่อ Cloudflare KV API ได้: ${String(err)}` };
    }
  }

  return { success: false, message: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Cloudflare' };
}

/**
 * Pull codes from Cloudflare (Worker or KV REST API)
 */
async function pullCodesFromCloudflare(): Promise<{ success: boolean; codes?: any[]; message: string }> {
  const config = getCloudflareConfig();

  // 1. Check Worker URL
  if (config.workerUrl) {
    try {
      const cleanUrl = config.workerUrl.replace(/\/+$/, '');
      const targetUrl = cleanUrl.endsWith('/api/codes') || cleanUrl.endsWith('/codes')
        ? cleanUrl
        : `${cleanUrl}/api/codes`;

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return { success: false, message: `Cloudflare Worker ตอบกลับสถานะ ${res.status}` };
      }

      const remoteCodes = await res.json();
      if (Array.isArray(remoteCodes)) {
        config.lastSyncedAt = new Date().toISOString();
        saveCloudflareConfig(config);
        return { success: true, codes: remoteCodes, message: `ดึงโค้ดสำเร็จ ${remoteCodes.length} รายการ` };
      }
      return { success: false, message: 'รูปแบบข้อมูลจาก Cloudflare Worker ไม่ถูกต้อง' };
    } catch (err) {
      return { success: false, message: `เกิดข้อผิดพลาดในการดึงโค้ด: ${String(err)}` };
    }
  }

  // 2. Check KV Direct REST API
  if (config.accountId && config.kvNamespaceId && config.apiToken) {
    try {
      const kvUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/kv/namespaces/${config.kvNamespaceId}/values/opm_redeem_codes_v1`;
      const res = await fetch(kvUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${config.apiToken}` },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return { success: false, message: `Cloudflare KV ตอบกลับสถานะ ${res.status}` };
      }

      const text = await res.text();
      let parsed = [];
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = [];
      }

      if (Array.isArray(parsed)) {
        config.lastSyncedAt = new Date().toISOString();
        saveCloudflareConfig(config);
        return { success: true, codes: parsed, message: `ดึงโค้ดสำเร็จ ${parsed.length} รายการ` };
      }
      return { success: false, message: 'รูปแบบข้อมูลจาก Cloudflare KV ไม่ถูกต้อง' };
    } catch (err) {
      return { success: false, message: `เกิดข้อผิดพลาดในการดึงโค้ด: ${String(err)}` };
    }
  }

  return { success: false, message: 'ยังไม่ได้ตั้งค่าการเชื่อมต่อ Cloudflare' };
}

// Check admin authentication middleware
function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const email = (req.headers['x-admin-email'] as string || '').toLowerCase().trim();
  if (email === ADMIN_EMAIL.toLowerCase()) {
    return next();
  }
  return res.status(403).json({
    error: `เฉพาะอีเมล ${ADMIN_EMAIL} เท่านั้นที่มีสิทธิ์เพิ่มหรือแก้ไขโค้ด`,
    code: 'UNAUTHORIZED_EMAIL',
  });
}

// GET /api/codes
app.get('/api/codes', async (_req, res) => {
  const localCodes = readCodes();
  // If local list is empty, attempt to pull from Cloudflare automatically
  if (localCodes.length === 0) {
    const config = getCloudflareConfig();
    if (config.workerUrl || (config.accountId && config.kvNamespaceId && config.apiToken)) {
      const remote = await pullCodesFromCloudflare();
      if (remote.success && remote.codes && remote.codes.length > 0) {
        writeCodes(remote.codes);
        return res.json(remote.codes);
      }
    }
  }
  res.json(localCodes);
});

// POST /api/codes (Add single code - Admin Only)
app.post('/api/codes', checkAdminAuth, (req, res) => {
  const newCode = req.body;
  if (!newCode || !newCode.code) {
    return res.status(400).json({ error: 'กรุณาระบุรหัสโค้ด' });
  }
  const codes = readCodes();
  // Ensure the latest code is placed at the very top
  const updated = [newCode, ...codes.filter((c) => c.id !== newCode.id)];
  writeCodes(updated);

  // Sync with Cloudflare in background
  pushCodesToCloudflare(updated).catch((err) => {
    console.error('Async Cloudflare push error:', err);
  });

  res.status(201).json(newCode);
});

// POST /api/codes/batch (Add batch codes - Admin Only)
app.post('/api/codes/batch', checkAdminAuth, (req, res) => {
  const { newCodes } = req.body;
  if (!Array.isArray(newCodes)) {
    return res.status(400).json({ error: 'ข้อมูลโค้ดไม่ถูกต้อง' });
  }
  const codes = readCodes();
  const incomingSet = new Set(newCodes.map((c) => (c.code || '').toUpperCase()));
  const filteredExisting = codes.filter((c) => !incomingSet.has((c.code || '').toUpperCase()));
  // Newest codes on top
  const updated = [...newCodes, ...filteredExisting];
  writeCodes(updated);

  // Sync with Cloudflare in background
  pushCodesToCloudflare(updated).catch((err) => {
    console.error('Async Cloudflare push error:', err);
  });

  res.status(201).json(updated);
});

// PUT /api/codes/:id (Edit code - Admin Only)
app.put('/api/codes/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const patch = req.body;
  const codes = readCodes();
  const index = codes.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบโค้ดที่ต้องการแก้ไข' });
  }
  codes[index] = { ...codes[index], ...patch, updatedAt: new Date().toISOString() };
  writeCodes(codes);

  // Sync with Cloudflare in background
  pushCodesToCloudflare(codes).catch((err) => {
    console.error('Async Cloudflare push error:', err);
  });

  res.json(codes[index]);
});

// DELETE /api/codes/:id (Delete code - Admin Only)
app.delete('/api/codes/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  let codes = readCodes();
  codes = codes.filter((c) => c.id !== id);
  writeCodes(codes);

  // Sync with Cloudflare in background
  pushCodesToCloudflare(codes).catch((err) => {
    console.error('Async Cloudflare push error:', err);
  });

  res.json({ success: true, message: 'ลบโค้ดเรียบร้อยแล้ว' });
});

// DELETE /api/codes (Clear all codes - Admin Only)
app.delete('/api/codes', checkAdminAuth, (_req, res) => {
  writeCodes([]);
  pushCodesToCloudflare([]).catch((err) => {
    console.error('Async Cloudflare push error:', err);
  });
  res.json({ success: true, message: 'ลบโค้ดทั้งหมดเรียบร้อยแล้ว' });
});

// POST /api/auth/verify (Verify if email is authorized admin)
app.post('/api/auth/verify', (req, res) => {
  const email = (req.body?.email || '').toLowerCase().trim();
  if (email === ADMIN_EMAIL.toLowerCase()) {
    res.json({
      authorized: true,
      email: ADMIN_EMAIL,
      role: 'ADMIN',
      message: `ยืนยันสิทธิ์แอดมินสำหรับ ${ADMIN_EMAIL} เรียบร้อยแล้ว`,
    });
  } else {
    res.status(403).json({
      authorized: false,
      email,
      role: 'GUEST',
      error: `ปฏิเสธการเข้าถึง: อีเมล ${email || 'ไม่ระบุ'} ไม่ได้รับสิทธิ์ เฉพาะ ${ADMIN_EMAIL} เท่านั้นที่มีสิทธิ์เพิ่ม/แก้ไข`,
    });
  }
});

// Cloudflare Integration Endpoints
// GET /api/cloudflare/status
app.get('/api/cloudflare/status', (_req, res) => {
  const config = getCloudflareConfig();
  const codes = readCodes();
  const isWorkerConfigured = !!config.workerUrl;
  const isKvConfigured = !!(config.accountId && config.kvNamespaceId && config.apiToken);
  const isConnected = isWorkerConfigured || isKvConfigured;

  res.json({
    isConnected,
    mode: isWorkerConfigured ? 'worker' : isKvConfigured ? 'kv' : 'local',
    workerUrl: config.workerUrl || null,
    isKvConfigured,
    hasAccountId: !!config.accountId,
    hasKvNamespaceId: !!config.kvNamespaceId,
    hasApiToken: !!config.apiToken,
    lastSyncedAt: config.lastSyncedAt || null,
    codeCount: codes.length,
  });
});

// POST /api/cloudflare/config (Save Cloudflare configuration - Admin Only)
app.post('/api/cloudflare/config', checkAdminAuth, async (req, res) => {
  const { workerUrl, accountId, kvNamespaceId, apiToken, autoSync } = req.body || {};
  const current = getCloudflareConfig();

  const updatedConfig: CloudflareConfig = {
    ...current,
    workerUrl: workerUrl !== undefined ? workerUrl.trim() : current.workerUrl,
    accountId: accountId !== undefined ? accountId.trim() : current.accountId,
    kvNamespaceId: kvNamespaceId !== undefined ? kvNamespaceId.trim() : current.kvNamespaceId,
    apiToken: apiToken !== undefined ? apiToken.trim() : current.apiToken,
    autoSync: autoSync !== undefined ? !!autoSync : current.autoSync,
  };

  saveCloudflareConfig(updatedConfig);

  // Test connection immediately
  let testResult = { success: true, message: 'บันทึกการตั้งค่าแล้ว' };
  const codes = readCodes();

  if (updatedConfig.workerUrl || (updatedConfig.accountId && updatedConfig.kvNamespaceId && updatedConfig.apiToken)) {
    // If we have local codes, push them to Cloudflare to initialize
    if (codes.length > 0) {
      testResult = await pushCodesToCloudflare(codes);
    } else {
      // Pull remote codes if local is empty
      const remote = await pullCodesFromCloudflare();
      if (remote.success && remote.codes && remote.codes.length > 0) {
        writeCodes(remote.codes);
        testResult = { success: true, message: `เชื่อมต่อสำเร็จและโหลด ${remote.codes.length} โค้ดจาก Cloudflare` };
      } else {
        testResult = { success: remote.success, message: remote.message };
      }
    }
  }

  res.json({
    success: testResult.success,
    message: testResult.message,
    config: {
      workerUrl: updatedConfig.workerUrl || null,
      isKvConfigured: !!(updatedConfig.accountId && updatedConfig.kvNamespaceId && updatedConfig.apiToken),
      lastSyncedAt: updatedConfig.lastSyncedAt || null,
    },
  });
});

// POST /api/cloudflare/sync (Manual sync trigger - Admin Only)
app.post('/api/cloudflare/sync', checkAdminAuth, async (req, res) => {
  const direction = req.body?.direction || 'push'; // 'push' | 'pull'
  const codes = readCodes();

  if (direction === 'pull') {
    const pullResult = await pullCodesFromCloudflare();
    if (pullResult.success && pullResult.codes) {
      writeCodes(pullResult.codes);
      return res.json({
        success: true,
        message: `ดึงโค้ดจาก Cloudflare สำเร็จ (${pullResult.codes.length} โค้ด)`,
        codes: pullResult.codes,
      });
    }
    return res.status(400).json({ success: false, message: pullResult.message });
  }

  // Default: push current local codes to Cloudflare
  const pushResult = await pushCodesToCloudflare(codes);
  if (pushResult.success) {
    return res.json({
      success: true,
      message: `ซิงค์โค้ด ${codes.length} รายการไปยัง Cloudflare เรียบร้อยแล้ว`,
    });
  }
  return res.status(400).json({ success: false, message: pushResult.message });
});

// GET /api/cloudflare/worker-template (Get copyable Cloudflare Worker code)
app.get('/api/cloudflare/worker-template', (_req, res) => {
  try {
    if (fs.existsSync(WORKER_SCRIPT_FILE)) {
      const content = fs.readFileSync(WORKER_SCRIPT_FILE, 'utf-8');
      return res.json({ code: content });
    }
  } catch (err) {
    console.error('Error reading worker template:', err);
  }
  res.json({ code: '// Cloudflare worker template' });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  // Attempt initial sync from Cloudflare on server start if configured
  const cfConfig = getCloudflareConfig();
  if (cfConfig.workerUrl || (cfConfig.accountId && cfConfig.kvNamespaceId && cfConfig.apiToken)) {
    pullCodesFromCloudflare().then((result) => {
      if (result.success && result.codes && result.codes.length > 0) {
        const local = readCodes();
        if (local.length === 0) {
          writeCodes(result.codes);
          console.log(`[Cloudflare] Synced ${result.codes.length} codes from Cloudflare on startup.`);
        }
      }
    }).catch((err) => {
      console.warn('[Cloudflare] Startup sync skipped:', err);
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
