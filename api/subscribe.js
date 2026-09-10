// POST /api/subscribe  { email, source }
//
// Validates the address, then forwards it to a Google Apps Script web app
// that appends one row to the capture sheet. Runs server side, so the sheet
// URL never appears in the page source and there is no CORS involved.
//
// Required env vars (Vercel -> Project -> Settings -> Environment Variables):
//   SHEET_WEBHOOK_URL  the Apps Script /exec URL
//   SHEET_SECRET       any long random string, must match the Apps Script
//
// See SETUP-EMAIL-CAPTURE.md for the ten minute setup.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clip(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  if (!body || typeof body !== 'object') body = {};

  // Honeypot. Real people never fill this in; bots fill in every field.
  // Answer 200 so the bot thinks it worked and does not retry.
  if (clip(body.website, 200).trim()) {
    return res.status(200).json({ ok: true });
  }

  const email = clip(body.email, 254).trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const webhook = process.env.SHEET_WEBHOOK_URL;
  if (!webhook) {
    console.error('SHEET_WEBHOOK_URL is not set');
    return res.status(500).json({ error: 'Signup is temporarily unavailable.' });
  }

  const row = {
    secret: process.env.SHEET_SECRET || '',
    email: email,
    source: clip(body.source, 60) || 'homepage',
    timestamp: new Date().toISOString(),
    referrer: clip(req.headers['referer'], 300),
    userAgent: clip(req.headers['user-agent'], 300)
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 8000);

    const upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      const detail = await upstream.text().catch(function () { return ''; });
      console.error('Sheet webhook returned', upstream.status, clip(detail, 500));
      return res.status(502).json({ error: 'Could not save that address. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Sheet webhook failed:', err && err.message);
    return res.status(502).json({ error: 'Could not save that address. Please try again.' });
  }
};
