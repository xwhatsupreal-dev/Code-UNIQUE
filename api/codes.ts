const CLOUDFLARE_WORKER_URL = 'https://opm-codes.itzreal-whatsupx.workers.dev/api/codes';

const FALLBACK_CODES = [
  {
    code: 'ควว',
    server: 'SEA',
    status: 'ACTIVE',
    rewards: [],
    description: 'โค้ดเซิร์ฟเวอร์ SEA',
    addedAt: 'ล่าสุด',
    addedAtTimestamp: 1791892131731,
    expiresAt: '???',
    verifiedWorking: true,
    workingVotes: 5,
    expiredVotes: 0,
    isNew: true,
    isHot: false,
    id: 'user-1791892131730-0-36mr',
  },
];

async function fetchCurrentFromCloudflare(): Promise<any[]> {
  try {
    const res = await fetch(CLOUDFLARE_WORKER_URL, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return FALLBACK_CODES;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. GET Codes
    if (req.method === 'GET') {
      const current = await fetchCurrentFromCloudflare();
      return res.status(200).json(current);
    }

    // 2. POST / PUT Codes (Supports both single code and multiple batch codes)
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {}
      }

      const currentCodes = await fetchCurrentFromCloudflare();
      let updatedList: any[] = [];

      if (Array.isArray(body)) {
        // If already an array, direct save (or merge if incoming is partial)
        updatedList = body;
      } else if (body && Array.isArray(body.newCodes)) {
        // Batch addition
        const incoming = body.newCodes;
        const incomingSet = new Set(incoming.map((c: any) => (c.code || '').toUpperCase()));
        const existingFiltered = currentCodes.filter((c: any) => !incomingSet.has((c.code || '').toUpperCase()));
        updatedList = [...incoming, ...existingFiltered];
      } else if (body && body.code) {
        // Single code addition or update
        const incoming = body;
        const filtered = currentCodes.filter(
          (c: any) => (c.code || '').toUpperCase() !== (incoming.code || '').toUpperCase() && c.id !== incoming.id
        );
        updatedList = [incoming, ...filtered];
      } else {
        updatedList = currentCodes;
      }

      // Save complete merged list to Cloudflare
      const response = await fetch(CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList),
      });

      const data = await response.json().catch(() => ({ success: true, count: updatedList.length }));
      return res.status(200).json(data);
    }

    // 3. DELETE Code
    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      const currentCodes = await fetchCurrentFromCloudflare();
      const updatedList = id ? currentCodes.filter((c: any) => c.id !== id) : [];

      await fetch(CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(200).json(FALLBACK_CODES);
  } catch (err) {
    return res.status(200).json(FALLBACK_CODES);
  }
}
