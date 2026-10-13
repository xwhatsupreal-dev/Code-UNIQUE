let memCodes = [];

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json; charset=utf-8'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    const kv = env?.OPM_KV || env?.CODES_KV;

    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const body = await req.json();
        const list = Array.isArray(body) ? body : (body?.codes || [body]);
        if (kv) {
          await kv.put('opm_codes', JSON.stringify(list));
        } else {
          memCodes = list;
        }
        return new Response(JSON.stringify({ success: true, count: list.length }), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: cors });
      }
    }

    try {
      if (kv) {
        const raw = await kv.get('opm_codes');
        if (raw) return new Response(raw, { headers: cors });
      }
      return new Response(JSON.stringify(memCodes), { headers: cors });
    } catch {
      return new Response(JSON.stringify([]), { headers: cors });
    }
  }
};
