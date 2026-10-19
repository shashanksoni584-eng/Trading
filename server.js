// Node 18+ | npm install && node server.js   (also works on Vercel)
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ZAP_KEY = process.env.ZAP_KEY || process.env.ZAP_TOKEN_KEY;   // "Zap Key" from panel.zapupi.com -> Developers -> API Keys
const { PRICE = 9, WHATSAPP_LINK = '' } = process.env;
const BASE_URL = process.env.BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000');
const ZAP = 'https://pay.zapupi.com/api';

const post = async (endpoint, body) => {
  const r = await fetch(`${ZAP}/${endpoint}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { status: 'error', message: text.slice(0, 200) }; }
};

app.post('/api/pay', async (req, res) => {
  try {
    const { name = '', mobile } = req.body;
    if (!/^[6-9]\d{9}$/.test(mobile || '')) return res.status(400).json({ error: 'Valid 10-digit mobile daalo' });
    const order_id = 'W' + Date.now();
    const j = await post('create-order', {
      zap_key: ZAP_KEY,
      order_id,
      amount: Number(PRICE),
      customer_mobile: mobile,
      remark: `Masterclass|${name}`.slice(0, 60),
      success_url: `${BASE_URL}/thanks.html?order_id=${order_id}`,
      failed_url: `${BASE_URL}/?payment=failed`
    });
    console.log('create-order response:', JSON.stringify(j));      // check Vercel > Logs if it fails
    const url = j.payment_url || (j.data && (j.data.payment_url || j.data.url)) || j.url;
    if (!url) return res.status(502).json({ error: j.message || 'Gateway error' });
    res.json({ url, order_id });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// NOTE: confirm endpoint + response fields against the "Order Status" tab in zapupi.com/docs
const isPaid = j => {
  const st = [j.data && j.data.status, j.payment_status, j.order_status, j.txn_status]
    .filter(Boolean).map(x => String(x).toLowerCase());
  return st.some(x => ['success', 'paid', 'completed'].includes(x));
};
app.get('/api/verify/:id', async (req, res) => {
  try {
    const j = await post('order-status', { zap_key: ZAP_KEY, order_id: req.params.id });
    console.log('order-status response:', JSON.stringify(j));
    const paid = isPaid(j);
    res.json({ paid, link: paid ? WHATSAPP_LINK : '' });
  } catch (e) { res.json({ paid: false }); }
});

if (require.main === module) app.listen(process.env.PORT || 3000, () => console.log('Running on', process.env.PORT || 3000));
module.exports = app;
