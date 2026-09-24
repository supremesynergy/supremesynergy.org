// POST /api/subscribe  { email, source }
//
// The free door. Takes an address, emails the guide, records the address.
//
// WHY THIS WAS REWRITTEN (2026-09-24). The old version's only job was to
// append a row to a Google Apps Script web app, and it returned HTTP 500 the
// moment SHEET_WEBHOOK_URL was unset. That script was never deployed, so the
// door returned 500 to every visitor from 2026-09-17 onward while the page
// promised "One email. One download." and sent neither.
//
// Two rules now hold:
//
//   1. The critical path uses only env vars that are ALREADY LIVE and already
//      delivering in production (RESEND_API_KEY / RESEND_FROM, proven by the
//      Stripe delivery email since 2026-09-21). Nothing here waits on a setup
//      step that has not happened.
//   2. A missing OPTIONAL integration can never fail the request. The sheet
//      and the Resend audience are best effort. We fail only when every way
//      of capturing the address failed, and then with 502 (retryable), never
//      500 (misconfigured).
//
// Required:
//   RESEND_API_KEY     re_... - already set, already sending
// Optional, all degrade quietly:
//   RESEND_FROM        "Braxton Luke <braxton@supremesynergy.org>" (default)
//   REPLY_TO           replies land here instead of the from address
//   DELIVERY_BCC       every signup also lands in this inbox. With this set,
//                      the list works with zero further setup.
//   RESEND_AUDIENCE_ID a Resend audience to add the contact to
//   SHEET_WEBHOOK_URL  the old Apps Script /exec URL, if it ever ships
//   SHEET_SECRET       must match the Apps Script

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SITE = 'https://supremesynergy.org';
const GUIDE_PATH = '/downloads/The-7-Most-Common-Mistakes.pdf';

function clip(value, max) {
  return String(value == null ? '' : value).slice(0, max);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function maskEmail(email) {
  return String(email).replace(/^(.).*(@.*)$/, '$1***$2');
}

// ---------------------------------------------------------------------------
// The email. Plain text is the primary copy; the HTML mirrors it.
// The ask is the guide's own closing ask (LEAD-MAGNET-7-MISTAKES-v2, the
// v2.3 subtraction pass): reply with the number. That turns a download into a
// conversation, which is the half of PQO a download alone never touches.

function buildGuideEmail() {
  const pdfUrl = SITE + GUIDE_PATH;

  const text = [
    'Here it is.',
    '',
    'The 7 Most Common Mistakes Spiritual Teachers and Coaches Make:',
    pdfUrl,
    '',
    'Save it once it opens. On an iPhone, tap the share icon and choose Save to Files or Books. On Android it lands in Downloads. Then it is yours even if you lose this email.',
    '',
    'Every teacher in it is teaching something real. I have learned from all of them. The mistake is not the piece they teach, it is teaching the piece as if it were the whole. Number seven is the one that explains the other six.',
    '',
    'One ask. When you finish, hit reply and send me the number that landed hardest. Just the number is fine. I read every one.',
    '',
    'I am teaching this live on Thursday October 1, and again in a US evening slot later in October. Reply and I will send you the link for whichever one works.',
    '',
    'Braxton'
  ].join('\n');

  // Deliberately styled to look like a plain message typed by a person.
  // The first version of this email carried a gold CTA button, a branded link
  // colour and a max-width wrapper, and Gmail filed it under Promotions
  // (founder's own inbox, 2026-09-24). Almost nobody replies from Promotions,
  // and a reply is this email's entire job. So: no button, no brand colour,
  // no wrapper, one link. If it still lands in Promotions, the next move is to
  // drop `html` from the payload entirely and send text only.
  const p = (s) => '<p style="margin:0 0 16px;">' + s + '</p>';
  const html = [
    '<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#222;">',
    p('Here it is.'),
    p('The 7 Most Common Mistakes Spiritual Teachers and Coaches Make:<br><a href="' + pdfUrl + '">' + esc(pdfUrl.replace('https://', '')) + '</a>'),
    p('Save it once it opens. On an iPhone, tap the share icon and choose Save to Files or Books. On Android it lands in Downloads. Then it is yours even if you lose this email.'),
    p('Every teacher in it is teaching something real. I have learned from all of them. The mistake is not the piece they teach, it is teaching the piece as if it were the whole. <strong>Number seven is the one that explains the other six.</strong>'),
    p('<strong>One ask.</strong> When you finish, hit reply and send me the number that landed hardest. Just the number is fine. I read every one.'),
    p('I am teaching this live on Thursday October 1, and again in a US evening slot later in October. Reply and I will send you the link for whichever one works.'),
    p('Braxton'),
    '</body></html>'
  ].join('');

  return {
    subject: 'The 7 Most Common Mistakes Spiritual Teachers and Coaches Make',
    text: text,
    html: html
  };
}

// ---------------------------------------------------------------------------
// Side effects. Each one reports rather than throws, so one failure never
// takes the others down with it.

async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timeout = setTimeout(function () { controller.abort(); }, ms);
  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    clearTimeout(timeout);
  }
}

async function sendGuide(email) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[subscribe] RESEND_API_KEY is not set, the guide cannot be emailed');
    return { ok: false, skipped: true };
  }

  const built = buildGuideEmail();
  const payload = {
    from: process.env.RESEND_FROM || 'Braxton Luke <braxton@supremesynergy.org>',
    to: [email],
    subject: built.subject,
    text: built.text,
    html: built.html,
    tags: [{ name: 'asset', value: 'seven-mistakes' }]
  };
  if (process.env.REPLY_TO) payload.reply_to = process.env.REPLY_TO;
  // Every signup also lands in the founder's inbox. With DELIVERY_BCC set,
  // the list exists and is searchable with no sheet and no further setup.
  if (process.env.DELIVERY_BCC) payload.bcc = [process.env.DELIVERY_BCC];

  try {
    const upstream = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }, 10000);

    if (!upstream.ok) {
      const detail = await upstream.text().catch(function () { return ''; });
      console.error('[subscribe] Resend returned', upstream.status, clip(detail, 300));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[subscribe] Resend failed:', err && err.message);
    return { ok: false };
  }
}

async function addToAudience(email) {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return { ok: false, skipped: true };

  try {
    const upstream = await fetchWithTimeout(
      'https://api.resend.com/audiences/' + encodeURIComponent(audienceId) + '/contacts',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email, unsubscribed: false })
      },
      8000
    );
    if (!upstream.ok) {
      // A duplicate is a success for our purposes: the address is on the list.
      if (upstream.status === 409) return { ok: true, duplicate: true };
      const detail = await upstream.text().catch(function () { return ''; });
      console.error('[subscribe] audience returned', upstream.status, clip(detail, 300));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[subscribe] audience failed:', err && err.message);
    return { ok: false };
  }
}

async function appendToSheet(row) {
  const webhook = process.env.SHEET_WEBHOOK_URL;
  if (!webhook) return { ok: false, skipped: true };

  try {
    const upstream = await fetchWithTimeout(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ secret: process.env.SHEET_SECRET || '' }, row))
    }, 8000);

    if (!upstream.ok) {
      const detail = await upstream.text().catch(function () { return ''; });
      console.error('[subscribe] sheet returned', upstream.status, clip(detail, 300));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[subscribe] sheet failed:', err && err.message);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------

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

  const source = clip(body.source, 60) || 'homepage';

  const results = await Promise.all([
    sendGuide(email),
    addToAudience(email),
    appendToSheet({
      email: email,
      source: source,
      timestamp: new Date().toISOString(),
      referrer: clip(req.headers['referer'], 300),
      userAgent: clip(req.headers['user-agent'], 300)
    })
  ]);

  const emailed = results[0].ok;
  const captured = results.some(function (r) { return r.ok; });

  if (!captured) {
    // Everything failed. That is a real outage, not a config gap, so say
    // "try again" rather than "unavailable" and let the visitor retry.
    console.error('[subscribe] every capture path failed for', maskEmail(email), 'source:', source);
    return res.status(502).json({ error: 'Could not save that address. Please try again.' });
  }

  // The visitor gets the download on /thanks either way, so a capture with a
  // failed send is still a 200. The log carries the difference.
  if (!emailed) {
    console.error('[subscribe] captured but not emailed:', maskEmail(email), 'source:', source);
  }

  return res.status(200).json({ ok: true, emailed: emailed });
};
