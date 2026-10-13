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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      try {
        const response = await fetch(CLOUDFLARE_WORKER_URL, {
          headers: { 'Accept': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            return res.status(200).json(data);
          }
        }
      } catch (e) {
        console.error('Vercel API worker fetch error:', e);
      }
      return res.status(200).json(FALLBACK_CODES);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const body = req.body;
        const response = await fetch(CLOUDFLARE_WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: typeof body === 'string' ? body : JSON.stringify(body),
        });
        const data = await response.json().catch(() => ({ success: true }));
        return res.status(200).json(data);
      } catch (e) {
        return res.status(200).json({ success: true, count: 1 });
      }
    }

    return res.status(200).json(FALLBACK_CODES);
  } catch (err) {
    return res.status(200).json(FALLBACK_CODES);
  }
}
