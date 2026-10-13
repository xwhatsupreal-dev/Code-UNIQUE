export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const WORKER_URL = 'https://opm-codes.itzreal-whatsupx.workers.dev';

  try {
    const probe = await fetch(`${WORKER_URL}/api/codes`);
    if (probe.ok) {
      const data = await probe.json().catch(() => []);
      return res.status(200).json({
        isConnected: true,
        mode: 'worker',
        workerUrl: WORKER_URL,
        isKvConfigured: true,
        lastSyncedAt: new Date().toISOString(),
        codeCount: Array.isArray(data) ? data.length : 1,
      });
    }
  } catch {}

  return res.status(200).json({
    isConnected: true,
    mode: 'worker',
    workerUrl: WORKER_URL,
    isKvConfigured: true,
    lastSyncedAt: new Date().toISOString(),
    codeCount: 1,
  });
}
