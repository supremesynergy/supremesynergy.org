// Local test for api/stripe-webhook.mjs. No network: fetch is replaced with a
// recorder. Run:  node scripts/test-stripe-webhook.mjs
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Readable } from 'node:stream';
import { POST, verifyStripeSignature, buildEmail, buyerFirstName } from '../api/stripe-webhook.mjs';

const SECRET = 'whsec_test_secret';
const URL_ = 'https://supremesynergy.org/api/stripe-webhook';

function baseEnv() {
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.RESEND_FROM = 'Braxton Luke <braxton@supremesynergy.org>';
  process.env.REPLY_TO = 'founder@example.com';
  process.env.DELIVERY_BCC = 'founder@example.com';
  process.env.SHEET_WEBHOOK_URL = 'https://sheet.test/exec';
  process.env.SHEET_SECRET = 'sheet-secret';
  delete process.env.BROKEN_MAP_PAYMENT_LINK;
}

function sign(raw, secret = SECRET, t = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac('sha256', secret).update(`${t}.${raw}`, 'utf8').digest('hex');
  return `t=${t},v1=${v1}`;
}

function event(overrides = {}, type = 'checkout.session.completed') {
  return JSON.stringify({
    id: 'evt_1',
    type,
    data: {
      object: Object.assign({
        id: 'cs_test_abc123',
        object: 'checkout.session',
        payment_status: 'paid',
        payment_link: 'plink_broken_map',
        customer_details: { email: 'Reader@Example.com', name: 'Jane Q Reader' }
      }, overrides)
    }
  });
}

let calls = [];
let resendStatus = 200;
globalThis.fetch = async (url, init) => {
  calls.push({ url, init, body: init && init.body ? JSON.parse(init.body) : null });
  if (String(url).startsWith('https://api.resend.com/')) {
    return new Response(resendStatus === 200 ? '{"id":"email_1"}' : 'boom', { status: resendStatus });
  }
  return new Response('{"ok":true}', { status: 200 });
};

async function webCall(raw, sigHeader, method = 'POST') {
  const headers = { 'content-type': 'application/json; charset=utf-8' };
  if (sigHeader) headers['stripe-signature'] = sigHeader;
  const req = new Request(URL_, { method, headers, body: method === 'GET' ? undefined : raw });
  // Vercel passes a context object as the second argument in web-handler mode.
  const res = await POST(req, { waitUntil() {} });
  return { status: res.status, body: await res.json() };
}

async function nodeCall(raw, sigHeader) {
  const req = Readable.from([Buffer.from(raw)]);
  req.method = 'POST';
  req.headers = { 'content-type': 'application/json', 'stripe-signature': sigHeader };
  const out = { headers: {} };
  const res = {
    setHeader(k, v) { out.headers[k] = v; },
    end(body) { out.body = JSON.parse(body); }
  };
  await POST(req, res);
  return { status: res.statusCode, body: out.body };
}

const results = [];
async function test(name, fn) {
  calls = []; resendStatus = 200; baseEnv();
  try { await fn(); results.push(['ok', name]); }
  catch (err) { results.push(['FAIL', name + ': ' + (err && err.message)]); }
}

await test('paid session sends the email and appends the buyer', async () => {
  const raw = event();
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true, delivered: true });
  assert.equal(calls.length, 2);
  const send = calls[0];
  assert.equal(send.url, 'https://api.resend.com/emails');
  assert.equal(send.init.headers['Authorization'], 'Bearer re_test_key');
  assert.equal(send.init.headers['Idempotency-Key'], 'delivery-cs_test_abc123');
  assert.deepEqual(send.body.to, ['reader@example.com']);
  assert.deepEqual(send.body.bcc, ['founder@example.com']);
  assert.equal(send.body.reply_to, 'founder@example.com');
  assert.equal(send.body.subject, 'Your copy of The Broken Map');
  assert.match(send.body.text, /^Hi Jane,/);
  assert.ok(send.body.text.includes('https://supremesynergy.org/reader-e299d46be3'));
  assert.ok(send.body.text.includes('https://supremesynergy.org/downloads/The-Broken-Map-Part-One-e299d46be3.pdf'));
  assert.ok(send.body.html.includes('href="https://supremesynergy.org/reader-e299d46be3"'));
  assert.ok(!/—/.test(send.body.text), 'no em dashes in the email');
  const sheet = calls[1];
  assert.equal(sheet.url, 'https://sheet.test/exec');
  assert.equal(sheet.body.email, 'reader@example.com');
  assert.equal(sheet.body.source, 'broken-map-buyer');
  assert.equal(sheet.body.secret, 'sheet-secret');
});

await test('missing name still greets', async () => {
  const raw = event({ customer_details: { email: 'x@example.com' } });
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.match(calls[0].body.text, /^Hi,\n/);
});

await test('name from Collect customer names (individual_name) wins', async () => {
  const raw = event({ customer_details: { email: 'x@example.com', name: 'Acme LLC', individual_name: 'Tarah Smith' } });
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.match(calls[0].body.text, /^Hi Tarah,/);
});

await test('name from collected_information when customer_details has none', async () => {
  const raw = event({ customer_details: { email: 'x@example.com' }, collected_information: { individual_name: 'Sahil K' } });
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.match(calls[0].body.text, /^Hi Sahil,/);
});

await test('buyerFirstName falls back in the right order', async () => {
  assert.equal(buyerFirstName({ customer_details: { individual_name: 'Ann B', name: 'Zed' } }), 'Ann');
  assert.equal(buyerFirstName({ collected_information: { individual_name: 'Bo C' } }), 'Bo');
  assert.equal(buyerFirstName({ customer_details: { name: 'Cy D' } }), 'Cy');
  assert.equal(buyerFirstName({ customer_details: { email: 'x@y.z' } }), '');
  assert.equal(buyerFirstName({}), '');
});

await test('bad signature is rejected before anything runs', async () => {
  const raw = event();
  const r = await webCall(raw, sign(raw, 'whsec_wrong'));
  assert.equal(r.status, 400);
  assert.equal(calls.length, 0);
});

await test('missing signature header is rejected', async () => {
  const r = await webCall(event(), '');
  assert.equal(r.status, 400);
  assert.equal(calls.length, 0);
});

await test('tampered body is rejected', async () => {
  const raw = event();
  const sig = sign(raw);
  const r = await webCall(raw.replace('reader@example.com', 'thief@example.com').replace('Reader@Example.com', 'thief@example.com'), sig);
  assert.equal(r.status, 400);
  assert.equal(calls.length, 0);
});

await test('stale timestamp is rejected', async () => {
  const raw = event();
  const r = await webCall(raw, sign(raw, SECRET, Math.floor(Date.now() / 1000) - 1000));
  assert.equal(r.status, 400);
  assert.equal(calls.length, 0);
});

await test('unpaid session is ignored (waits for async payment)', async () => {
  const raw = event({ payment_status: 'unpaid' });
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.equal(r.body.ignored, true);
  assert.equal(calls.length, 0);
});

await test('async_payment_succeeded delivers', async () => {
  const raw = event({}, 'checkout.session.async_payment_succeeded');
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.equal(r.body.delivered, true);
});

await test('100% promo code (no_payment_required) delivers', async () => {
  const raw = event({ payment_status: 'no_payment_required' });
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.equal(r.body.delivered, true);
});

await test('other event types are ignored', async () => {
  const raw = event({}, 'payment_intent.succeeded');
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.equal(r.body.ignored, true);
  assert.equal(calls.length, 0);
});

await test('session without an email is ignored, not retried', async () => {
  const raw = event({ customer_details: { name: 'No Email' } });
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.equal(r.body.reason, 'no email');
  assert.equal(calls.length, 0);
});

await test('Resend failure returns 500 so Stripe retries', async () => {
  resendStatus = 500;
  const raw = event();
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 500);
  assert.equal(calls.length, 1);
});

await test('missing RESEND_API_KEY returns 500', async () => {
  delete process.env.RESEND_API_KEY;
  const raw = event();
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 500);
  assert.equal(calls.length, 0);
});

await test('sheet not configured: still delivers, sheet skipped', async () => {
  delete process.env.SHEET_WEBHOOK_URL;
  const raw = event();
  const r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.equal(calls.length, 1);
});

await test('BROKEN_MAP_PAYMENT_LINK restricts to that link', async () => {
  process.env.BROKEN_MAP_PAYMENT_LINK = 'plink_broken_map';
  let raw = event({ payment_link: 'plink_other' });
  let r = await webCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.equal(r.body.reason, 'payment link');
  assert.equal(calls.length, 0);
  raw = event();
  r = await webCall(raw, sign(raw));
  assert.equal(r.body.delivered, true);
});

await test('GET is refused', async () => {
  const r = await webCall('', '', 'GET');
  assert.equal(r.status, 405);
});

await test('older Node (req, res) shape also works', async () => {
  const raw = event();
  const r = await nodeCall(raw, sign(raw));
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true, delivered: true });
  assert.equal(calls.length, 2);
});

await test('verifyStripeSignature accepts any matching v1 among several', async () => {
  const raw = '{"a":1}';
  const t = 1700000000;
  const good = createHmac('sha256', SECRET).update(`${t}.${raw}`).digest('hex');
  const header = `t=${t},v1=${'0'.repeat(64)},v1=${good}`;
  assert.equal(verifyStripeSignature(raw, header, SECRET, t).ok, true);
  assert.equal(verifyStripeSignature(raw, `t=${t},v1=${'0'.repeat(64)}`, SECRET, t).ok, false);
});

await test('buildEmail has both parts and the sales link', async () => {
  const e = buildEmail({ key: 'broken-map', name: 'X', readerPath: '/r', pdfPath: '/p.pdf', salesPath: '/broken-map', subject: 'S' }, { email: 'a@b.co', firstName: '' });
  assert.equal(e.subject, 'S');
  assert.ok(e.text.includes('https://supremesynergy.org/broken-map'));
  assert.ok(e.html.includes('https://supremesynergy.org/broken-map'));
});

let failed = 0;
for (const [status, name] of results) {
  if (status !== 'ok') failed++;
  console.log(`${status === 'ok' ? '  ok ' : ' FAIL'}  ${name}`);
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
