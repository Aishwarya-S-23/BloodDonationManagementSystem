 (async () => {
  const base = process.env.SMOKE_BASE || 'http://127.0.0.1:5000/api';
  const fetch = global.fetch || require('node-fetch');

  const MAX_HEALTH_RETRIES = 12;
  const HEALTH_INITIAL_DELAY = 500; // ms

  const ALLOW_RUN = process.argv.includes('--run') || process.env.SMOKE_FLOW_ALLOW === 'true';
  if (!ALLOW_RUN) {
    console.error('Safety: destructive smoke flow requires --run flag or SMOKE_FLOW_ALLOW=true');
    console.error('To execute: node scripts/smoke_flow.js --run');
    process.exitCode = 1;
    return;
  }

  async function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

  async function waitForHealth(){
    let attempt = 0;
    let delay = HEALTH_INITIAL_DELAY;
    while (attempt < MAX_HEALTH_RETRIES){
      try{
        const res = await fetch(base.replace('/api','') + '/health');
        if (res && res.status === 200){
          console.log('Health check OK');
          return true;
        }
      } catch (e){ /* ignore and retry */ }
      attempt++;
      console.log(`Health check attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
      delay = Math.min(5000, delay * 2);
    }
    console.error('Health check failed after retries');
    return false;
  }

  async function fetchWithRetry(url, opts = {}, retries = 4, backoff = 300){
    let attempt = 0;
    while (attempt <= retries){
      try{
        const res = await fetch(url, opts);
        // Treat 5xx as retryable
        if (res.status >= 500 && attempt < retries){
          attempt++;
          await sleep(backoff);
          backoff *= 2;
          continue;
        }
        const text = await res.text();
        let json = null;
        try{ json = JSON.parse(text); } catch(e){ json = text; }
        return { status: res.status, body: json };
      } catch (e){
        if (attempt === retries) throw e;
        attempt++;
        await sleep(backoff);
        backoff *= 2;
      }
    }
  }

  async function post(url, body, token){
    const headers = Object.assign({'Content-Type':'application/json'}, token ? { Authorization: `Bearer ${token}` } : {});
    return fetchWithRetry(url, { method: 'POST', headers, body: JSON.stringify(body) });
  }

  async function get(url, token){
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return fetchWithRetry(url, { method: 'GET', headers });
  }

  try{
    const ready = await waitForHealth();
    if (!ready) return;

    const now = Date.now();
    const hospital = { email: `smoke-hospital+${now}@example.com`, password: 'SmokeTest1!', role: 'Hospital', profileData: { name: 'Smoke Hospital', address: { street: '1 Test St', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' }, contact: { phone: '9999999999' } } };
    const bloodbank = { email: `smoke-bb+${now}@example.com`, password: 'SmokeTest1!', role: 'BloodBank', profileData: { name: 'Smoke BloodBank', address: { street: '2 Bank Rd', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001' }, contact: { phone: '8888888888' } } };

    console.log('Registering hospital...');
    const regH = await post(base + '/auth/register', hospital);
    console.log('Hospital register:', regH.status, regH.body && regH.body.message);

    console.log('Registering blood bank...');
    const regB = await post(base + '/auth/register', bloodbank);
    console.log('BloodBank register:', regB.status, regB.body && regB.body.message);

    // Login
    console.log('Logging in hospital...');
    const loginH = await post(base + '/auth/login', { email: hospital.email, password: hospital.password });
    console.log('Hospital login:', loginH.status);
    const tokenH = loginH.body && loginH.body.data && loginH.body.data.token;

    console.log('Logging in blood bank...');
    const loginB = await post(base + '/auth/login', { email: bloodbank.email, password: bloodbank.password });
    console.log('BloodBank login:', loginB.status);
    const tokenB = loginB.body && loginB.body.data && loginB.body.data.token;

    // Create a blood request as hospital
    if (!tokenH) { console.error('Hospital login failed, aborting request creation'); return; }
    const deadline = new Date(Date.now() + 24*60*60*1000).toISOString();
    console.log('Creating blood request as hospital...');
    const createReq = await post(base + '/hospitals/requests', { bloodGroup: 'O+', component: 'red_cells', units: 2, urgency: 'critical', deadline, notes: 'Smoke test request' }, tokenH);
    console.log('Create request:', createReq.status, (createReq.body && createReq.body.message) ? createReq.body.message : JSON.stringify(createReq.body));

    const requestId = createReq.body && createReq.body.data && createReq.body.data.request && createReq.body.data.request._id;

    // As blood bank, list assigned requests
    if (!tokenB) { console.error('BloodBank login failed, skipping assigned requests check'); }
    else {
      console.log('Listing assigned requests for blood bank...');
      const assigned = await get(base + '/blood-banks/requests', tokenB);
      console.log('Assigned requests status:', assigned.status);
      if (assigned.body && assigned.body.data) console.log('Assigned count:', (assigned.body.data.requests || []).length);
    }

    // Add inventory as blood bank
    const bloodBankProfileId = loginB.body && loginB.body.data && loginB.body.data.user && loginB.body.data.user.profileId;
    if (tokenB && bloodBankProfileId){
      console.log('Adding inventory as blood bank...');
      const expiry = new Date(Date.now() + 10*24*60*60*1000).toISOString();
      const addInv = await post(base + '/blood-banks/inventory', { bloodBankId: bloodBankProfileId, bloodGroup: 'O+', component: 'red_cells', units: 10, expiryDate: expiry, batchNumber: `SM-${now}`, source: 'donation' }, tokenB);
      console.log('Add inventory status:', addInv.status, addInv.body && addInv.body.message);

      // Try to fulfill request from inventory
      if (requestId){
        console.log('Fulfilling request from blood bank inventory...');
        const fulfill = await post(base + '/blood-banks/inventory/fulfill', { requestId, units: 2 }, tokenB);
        console.log('Fulfill status:', fulfill.status, fulfill.body && fulfill.body.message);
      }
    }

    console.log('Smoke flow complete.');

  } catch (e){
    console.error('Smoke flow error:', e);
    process.exitCode = 2;
  }
})();
