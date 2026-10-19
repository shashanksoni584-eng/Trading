// Node 18+ | npm install && node server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const { ZAP_TOKEN_KEY, ZAP_SECRET_KEY, BASE_URL = 'http://localhost:3000', PRICE = 9, WHATSAPP_LINK = '' } = process.env;
const ZAP = 'https://api.zapupi.com/api';   // verify endpoint names in your ZapUPI dashboard docs

app.post('/api/pay', async (req, res) => {
  try {
    const { name = '', mobile } = req.body;
    if (!/^[6-9]\d{9}$/.test(mobile || '')) return res.status(400).json({ error: 'Valid 10-digit mobile daalo' });
    const order_id = 'W' + Date.now();
    const body = new URLSearchParams({
      token_key: ZAP_TOKEN_KEY, secret_key: ZAP_SECRET_KEY, amount: String(PRICE), order_id,
      custumer_mobile: mobile,                       // (sic) spelling as per ZapUPI docs
      redirect_url: `${BASE_URL}/thanks.html?order_id=${order_id}`,
      remark: `Masterclass - ${name}`.slice(0, 60)
    });
    const j = await (await fetch(`${ZAP}/create-order`, { method: 'POST', body })).json();
    if (j.status !== 'success') return res.status(502).json({ error: j.message || 'Gateway error' });
    res.json({ url: j.payment_url, order_id });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/verify/:id', async (req, res) => {
  try {
    const body = new URLSearchParams({ token_key: ZAP_TOKEN_KEY, secret_key: ZAP_SECRET_KEY, order_id: req.params.id });
    const j = await (await fetch(`${ZAP}/order-status`, { method: 'POST', body })).json();
    const paid = j.status === 'success' && j.data && j.data.status === 'Success';
    res.json({ paid, link: paid ? WHATSAPP_LINK : '' });
  } catch (e) { res.json({ paid: false }); }
});

app.listen(process.env.PORT || 3000, () => console.log('Running on', process.env.PORT || 3000));
