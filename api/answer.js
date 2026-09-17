// POST /api/answer  { answer, detail, email }
//
// Records the one question on the thank-you page ("What broke the official
// story for you?"). Forwards to the same Google Apps Script web app as
// /api/subscribe, tagged type: 'answer', and the script writes one row to an
// "Answers" tab in the capture sheet.
//
// The script needs the small addition in SETUP-EMAIL-CAPTURE.md, Step 6.
// Until that is in, the script does not store answers, so every answer is
// also written to the function log (without the email) as a fallback.
//
// Uses the same env vars as /api/subscribe: SHEET_WEBHOOK_URL, SHEET_SECRET.

const ANSWERS = new Set([
  'religion',
  'science',
  'experience',
  'health',
  'success',
  'growth',
  'other'
]);

const EMAIL_RE = /^[^\s@=+\-][^\s@]*@[^\s@]+\.[^\s@]{2,}$/;

function clip(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

// Free text goes into a spreadsheet cell. A leading = + - or @ would be read
// as a formula, so prefix it with an apostrophe to keep it plain text.
function cellText(value, max) {
  const text = clip(value, max).replace(/[\r\n\t]+/g, ' ').trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
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

  const answer = clip(body.answer, 20).trim();
  if (!ANSWERS.has(answer)) {
    return res.status(400).json({ error: 'Unknown answer.' });
  }

  const detail = answer === 'other' ? cellText(body.detail, 280) : '';

  let email = clip(body.email, 254).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) email = '';

  // Fallback record. No email here, the log is not the list.
  console.log('answer ' + JSON.stringify({ answer: answer, detail: detail, matched: Boolean(email) }));

  const webhook = process.env.SHEET_WEBHOOK_URL;
  if (!webhook) {
    console.error('SHEET_WEBHOOK_URL is not set');
    // The reader has already been thanked. Nothing useful to tell them.
    return res.status(200).json({ ok: true });
  }

  const row = {
    secret: process.env.SHEET_SECRET || '',
    type: 'answer',
    answer: answer,
    detail: detail,
    email: email,
    timestamp: new Date().toISOString()
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

    const data = await upstream.json().catch(function () { return {}; });
    if (!upstream.ok || !data || data.answered !== true) {
      console.warn(
        'Answer not stored in the sheet. Add the Step 6 block to the Apps Script. Upstream said: ' +
        clip(JSON.stringify(data), 300)
      );
    }
  } catch (err) {
    console.error('Answer webhook failed:', err && err.message);
  }

  return res.status(200).json({ ok: true });
};
