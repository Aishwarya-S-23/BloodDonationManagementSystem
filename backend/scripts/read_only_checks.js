(async () => {
  const urls = [
    'http://127.0.0.1:5000/health',
    'http://127.0.0.1:5000/api/public/facilities',
    'http://127.0.0.1:5000/api/public/emergency-requests',
    'http://127.0.0.1:5000/api/public/emergency-zones',
    'http://127.0.0.1:5000/api/public/facilities/nearby?lat=19.0760&lng=72.8777',
    'http://127.0.0.1:5000/api/auth/profile'
  ];

  async function fetchWithTimeout(url, opts = {}, timeout = 10000){
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try{
      const res = await fetch(url, { signal: controller.signal, ...opts });
      const text = await res.text();
      return { url, ok: res.ok, status: res.status, body: text.slice(0,2000) };
    } catch (e){
      return { url, error: e.message, code: e.code || null };
    } finally { clearTimeout(id); }
  }

  for (const u of urls){
    console.log('---', u, '---');
    const r = await fetchWithTimeout(u);
    if (r.error) console.log('ERROR:', r.error, r.code || '');
    else {
      console.log('Status:', r.status);
      try{ console.log('Body snippet:', r.body); } catch(e){ /* ignore */ }
    }
    console.log('\n');
  }
})();
