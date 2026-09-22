// POST /api/stripe-webhook
//
// Stripe calls this after a Payment Link checkout completes. It verifies the
// signature, then emails the buyer their copy of the book (the reader page
// plus the direct PDF link), BCCs the founder so every sale lands in his
// inbox, and appends the buyer to the capture sheet as source
// "broken-map-buyer" when that sheet is configured.
//
// Why this exists: Stripe Payment Links do not deliver files and their
// receipts cannot carry a link. Before this, the redirect page after checkout
// was the only copy of the link. A buyer who closed it had nothing.
//
// Required env vars (Vercel -> Project -> Settings -> Environment Variables):
//   STRIPE_WEBHOOK_SECRET  whsec_... from the endpoint page in Stripe
//   RESEND_API_KEY         re_... from resend.com, sending access is enough
// Optional:
//   RESEND_FROM            "Braxton Luke <braxton@supremesynergy.org>" (default)
//   REPLY_TO               the inbox you read; replies to the email go here
//   DELIVERY_BCC           your inbox; a copy of every delivery lands there
//   BROKEN_MAP_PAYMENT_LINK  plink_... ; when set, only this link is delivered
//   SHEET_WEBHOOK_URL, SHEET_SECRET  same as /api/subscribe; buyer row is added
//
// See SETUP-DELIVERY-EMAIL.md for the setup and the test purchase.
//
// Uses the Web handler signature (request.text() gives the raw body, which the
// signature check needs). Also tolerates the older Node (req, res) shape.

import { createHmac, timingSafeEqual } from 'node:crypto';

const SITE = 'https://supremesynergy.org';
const SIGNATURE_TOLERANCE_SECONDS = 300;
const DELIVERABLE_STATUSES = new Set(['paid', 'no_payment_required']);

const BROKEN_MAP = {
  key: 'broken-map',
  name: 'The Broken Map, Part One',
  readerPath: '/reader-e299d46be3',
  pdfPath: '/downloads/The-Broken-Map-Part-One-e299d46be3.pdf',
  salesPath: '/broken-map',
  subject: 'Your copy of The Broken Map'
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------------------------------------------------------------------------
// Request plumbing: works whether Vercel hands us a Web Request or a Node req.

function isWebRequest(value) {
  return value && typeof value.text === 'function' && typeof value.headers?.get === 'function';
}

async function readRawBody(reqOrRequest) {
  if (isWebRequest(reqOrRequest)) return reqOrRequest.text();
  const req = reqOrRequest;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object' && !req.readable) {
    // The platform already parsed the body. The bytes are gone, and a
    // re-serialised object will not match Stripe's signature.
    throw new Error('raw body unavailable: body was parsed before the handler ran');
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function getHeader(reqOrRequest, name) {
  if (isWebRequest(reqOrRequest)) return reqOrRequest.headers.get(name) || '';
  const value = reqOrRequest.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : (value || '');
}

function getMethod(reqOrRequest) {
  return String(reqOrRequest.method || 'GET').toUpperCase();
}

function isNodeResponse(value) {
  return value && typeof value.setHeader === 'function' && typeof value.end === 'function';
}

// In web-handler mode the second argument is a context object, not a Node
// response, so the shape is checked rather than the presence.
function respond(res, status, payload) {
  const body = JSON.stringify(payload);
  if (!isNodeResponse(res)) {
    return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(body);
  return undefined;
}

// ---------------------------------------------------------------------------
// Stripe signature: https://docs.stripe.com/webhooks/signature

export function verifyStripeSignature(rawBody, header, secret, nowSeconds) {
  if (!header || !secret) return { ok: false, reason: 'missing signature or secret' };
  const parts = {};
  for (const item of header.split(',')) {
    const eq = item.indexOf('=');
    if (eq < 1) continue;
    const key = item.slice(0, eq).trim();
    const value = item.slice(eq + 1).trim();
    if (key === 'v1') (parts.v1 = parts.v1 || []).push(value);
    else parts[key] = value;
  }
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || !parts.v1 || parts.v1.length === 0) {
    return { ok: false, reason: 'malformed signature header' };
  }
  const now = nowSeconds == null ? Math.floor(Date.now() / 1000) : nowSeconds;
  if (Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: 'timestamp outside tolerance' };
  }
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  for (const candidate of parts.v1) {
    const candidateBuffer = Buffer.from(candidate, 'utf8');
    if (candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer)) {
      return { ok: true };
    }
  }
  return { ok: false, reason: 'no matching signature' };
}

// ---------------------------------------------------------------------------
// Which product a session bought.

function productForSession(session) {
  const onlyLink = process.env.BROKEN_MAP_PAYMENT_LINK;
  if (onlyLink && session.payment_link !== onlyLink) return null;
  return BROKEN_MAP;
}

function firstName(fullName) {
  const name = String(fullName || '').trim().split(/\s+/)[0] || '';
  return name.length > 40 ? '' : name;
}

// ---------------------------------------------------------------------------
// The email. Plain text is the primary copy; the HTML mirrors it.

export function buildEmail(product, buyer) {
  const readerUrl = SITE + product.readerPath;
  const pdfUrl = SITE + product.pdfPath;
  const salesUrl = SITE + product.salesPath;
  const greeting = buyer.firstName ? `Hi ${buyer.firstName},` : 'Hi,';

  const text = [
    greeting,
    '',
    'Thank you. You are a founding reader, and that means something to me.',
    '',
    'Your copy lives here, and this page is yours to keep:',
    readerUrl,
    '',
    'The file itself, if you want it directly:',
    pdfUrl,
    '',
    'Save it once it opens. On an iPhone, tap the share icon and choose Save to Files or Books. On Android it lands in Downloads. Then it is on your device even if you lose this email.',
    '',
    'Before you start: read it in one sitting if you can, somewhere quiet. When you reach the four engines, notice which one is yours. Then tell me on Instagram, @braxtonluke. I read everything.',
    '',
    'If anything breaks, reply to this email.',
    '',
    'Braxton',
    '',
    `This link is for you. If someone you know should read the book, send them to ${salesUrl}`
  ].join('\n');

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const p = (s) => `<p style="margin:0 0 18px;">${s}</p>`;
  const html = [
    '<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#ffffff;color:#1a1611;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:17px;line-height:1.6;">',
    '<div style="max-width:560px;margin:0 auto;">',
    p(esc(greeting)),
    p('Thank you. You are a founding reader, and that means something to me.'),
    p('Your copy lives here, and this page is yours to keep:'),
    `<p style="margin:0 0 24px;"><a href="${readerUrl}" style="display:inline-block;background:#d4af37;color:#0a0908;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:6px;">Open your copy</a></p>`,
    p(`The file itself, if you want it directly:<br><a href="${pdfUrl}" style="color:#8a6d1a;">${esc(pdfUrl)}</a>`),
    p('Save it once it opens. On an iPhone, tap the share icon and choose Save to Files or Books. On Android it lands in Downloads. Then it is on your device even if you lose this email.'),
    p('<strong>Before you start.</strong> Read it in one sitting if you can, somewhere quiet. When you reach the four engines, notice which one is yours. Then tell me on Instagram, @braxtonluke. I read everything.'),
    p('If anything breaks, reply to this email.'),
    p('Braxton'),
    `<p style="margin:28px 0 0;font-size:14px;color:#877c69;">This link is for you. If someone you know should read the book, send them to <a href="${salesUrl}" style="color:#877c69;">${esc(salesUrl.replace('https://', ''))}</a>.</p>`,
    '</div></body></html>'
  ].join('');

  return { subject: product.subject, text, html };
}

// ---------------------------------------------------------------------------
// Side effects.

async function sendWithResend(session, product, buyer) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const email = buildEmail(product, buyer);
  const payload = {
    from: process.env.RESEND_FROM || 'Braxton Luke <braxton@supremesynergy.org>',
    to: [buyer.email],
    subject: email.subject,
    text: email.text,
    html: email.html,
    tags: [{ name: 'product', value: product.key }]
  };
  if (process.env.REPLY_TO) payload.reply_to = process.env.REPLY_TO;
  if (process.env.DELIVERY_BCC) payload.bcc = [process.env.DELIVERY_BCC];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Stripe retries on any non-2xx. The same session never sends twice.
        'Idempotency-Key': `delivery-${session.id}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      throw new Error(`Resend returned ${upstream.status}: ${detail.slice(0, 300)}`);
    }
    return upstream.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }
}

async function appendBuyerToSheet(session, product, buyer) {
  const webhook = process.env.SHEET_WEBHOOK_URL;
  if (!webhook) return { skipped: true };
  const row = {
    secret: process.env.SHEET_SECRET || '',
    email: buyer.email,
    source: `${product.key}-buyer`,
    timestamp: new Date().toISOString(),
    referrer: 'stripe:' + String(session.id).slice(0, 60),
    userAgent: 'stripe-webhook'
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
      signal: controller.signal
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('[stripe-webhook] sheet returned', upstream.status, detail.slice(0, 300));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[stripe-webhook] sheet failed:', err && err.message);
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Handler.

export async function POST(reqOrRequest, res) {
  if (getMethod(reqOrRequest) !== 'POST') {
    return respond(res, 405, { error: 'Method not allowed.' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(reqOrRequest);
  } catch (err) {
    console.error('[stripe-webhook]', err && err.message);
    return respond(res, 500, { error: 'Could not read request body.' });
  }

  const verdict = verifyStripeSignature(
    rawBody,
    getHeader(reqOrRequest, 'stripe-signature'),
    process.env.STRIPE_WEBHOOK_SECRET
  );
  if (!verdict.ok) {
    console.error('[stripe-webhook] rejected:', verdict.reason);
    return respond(res, 400, { error: 'Invalid signature.' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (_) {
    return respond(res, 400, { error: 'Invalid JSON.' });
  }

  const type = event && event.type;
  if (type !== 'checkout.session.completed' && type !== 'checkout.session.async_payment_succeeded') {
    return respond(res, 200, { ignored: true, reason: 'event type' });
  }

  const session = event.data && event.data.object;
  if (!session || !session.id) {
    return respond(res, 400, { error: 'No session in event.' });
  }
  if (!DELIVERABLE_STATUSES.has(session.payment_status)) {
    // Bank-debit style methods complete first and pay later; Stripe sends
    // async_payment_succeeded when the money arrives, and we deliver then.
    return respond(res, 200, { ignored: true, reason: 'payment status ' + session.payment_status });
  }

  const product = productForSession(session);
  if (!product) {
    console.log('[stripe-webhook] ignored session for another payment link', session.id, session.payment_link);
    return respond(res, 200, { ignored: true, reason: 'payment link' });
  }

  const details = session.customer_details || {};
  const email = String(details.email || session.customer_email || '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    console.error('[stripe-webhook] session has no usable email', session.id);
    return respond(res, 200, { ignored: true, reason: 'no email' });
  }
  const buyer = { email, firstName: firstName(details.name) };

  try {
    await sendWithResend(session, product, buyer);
  } catch (err) {
    console.error('[stripe-webhook] send failed:', err && err.message);
    // 500 makes Stripe retry, and the idempotency key keeps that safe.
    return respond(res, 500, { error: 'Delivery email failed.' });
  }

  const sheet = await appendBuyerToSheet(session, product, buyer);
  console.log('[stripe-webhook] delivered', JSON.stringify({ session: session.id, to: email, product: product.key, sheet }));
  return respond(res, 200, { ok: true, delivered: true });
}
