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
//
// 2026-09-24: the sheet was never deployed, so every answer to the avatar-gate
// question was going to a Vercel log nobody reads. Answers are now also
// emailed to DELIVERY_BCC (already set, already delivering), best effort, so
// the question is worth asking. Each answer is a warm name plus the reason
// they are warm, which is exactly the touch generator the sprint runs on.

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

  const notified = notifyFounder(answer, detail, email);

  const webhook = process.env.SHEET_WEBHOOK_URL;
  if (!webhook) {
    console.error('SHEET_WEBHOOK_URL is not set');
    // The reader has already been thanked. Nothing useful to tell them.
    await notified;
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

  await notified;
  return res.status(200).json({ ok: true });
};

// Best effort: put the answer in front of the founder. Never blocks, never
// throws into the handler, and is fire-and-forget by design.
async function notifyFounder(answer, detail, email) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DELIVERY_BCC;
  if (!apiKey || !to) return;

  const who = email || 'no email matched';
  const lines = [
    'Answer: ' + answer,
    detail ? 'They said: ' + detail : '',
    'Who: ' + who,
    '',
    'That is a warm name and the reason they are warm. Reply to them.'
  ].filter(Boolean).join('\n');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 8000);
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Braxton Luke <braxton@supremesynergy.org>',
        to: [to],
        subject: 'What broke the official story: ' + answer,
        text: lines,
        tags: [{ name: 'kind', value: 'answer' }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (err) {
    console.error('Answer notify failed:', err && err.message);
  }
}
