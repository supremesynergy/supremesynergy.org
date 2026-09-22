# Delivery email setup (about 40 minutes, one time)

When someone buys *The Broken Map* through the Stripe link, Stripe now calls
`/api/stripe-webhook` on this site. That function emails the buyer their copy
(the reader page plus the direct PDF link), sends you a copy of every
delivery, and adds the buyer to the capture sheet once that sheet is set up.

Why: Stripe Payment Links do not deliver files and their receipts cannot carry
a link. Until this is live, the page after checkout is the only copy of the
link, and a buyer who closes it has nothing.

Nothing here costs money at this volume. Resend's free tier sends 3,000 emails
a month.

---

## Step 1 — Resend account, domain, key (15 minutes)

> Done 2026-09-22: `supremesynergy.org` is verified in Resend. Kept for the
> record and for a second domain. The records below are what Resend asked for
> that day; copy from the Resend screen, never from a guide.

1. Go to <https://resend.com> and create an account with the email you read.
2. **Domains → Add Domain** → `supremesynergy.org` → region can stay default.
3. Resend shows the DNS records to add. Open a second tab: Namecheap → Domain
   List → `supremesynergy.org` → **Manage → Advanced DNS**. All of them go in
   the **Host Records** section with **Add New Record**. Domains added to
   Resend after August 2026 get these four:

   | Type | Host (Namecheap) | Value | Note |
   |---|---|---|---|
   | TXT | `resend._domainkey` | the long `p=...` value | DKIM |
   | CNAME | `send` | `send.<something>.rmta.net` as shown | sending |
   | CNAME | `rsend` | `rsend.<something>.rmta.net` as shown | sending, note the spelling |
   | TXT | `_dmarc` | `v=DMARC1; p=none;` | optional |

   Three things that cost time on 2026-09-22:
   - In the Host box type only the part before `.supremesynergy.org`.
   - Resend's older Namecheap guide describes an MX and an SPF TXT on `send`.
     Do not add those when Resend shows CNAMEs. A CNAME cannot share its host
     with any other record, so they block each other.
   - Leave **Mail Settings** on **Email Forwarding**. The CNAMEs do not need
     Custom MX, and switching to Custom MX drops the five forwarding rows and
     the root SPF line. If that happened, switch back and they return.
   - The CNAME values are cut short on the Resend screen with `[...]`; use the
     copy icon so the whole value comes across.
4. Back in Resend the rows turn to **Verified** on their own within minutes.
   The domain status at the top of the page says Verified when all are in.
5. **API Keys → Create API Key**: name `supremesynergy.org delivery`,
   permission **Sending access**, domain `supremesynergy.org`. Copy the
   `re_...` key now; it is shown once.

## Step 2 — Put the code live (2 minutes)

From this folder:

```bash
cd ~/Code/supremesynergy.org && git add api/stripe-webhook.mjs scripts/test-stripe-webhook.mjs SETUP-DELIVERY-EMAIL.md reader-e299d46be3.html && git commit -m "Email every buyer their copy of The Broken Map" && git push
```

Vercel deploys the push. The function answers with an error until Step 4 is
done, and that is fine: nothing calls it yet.

## Step 3 — Tell Stripe where to send events (5 minutes)

1. <https://dashboard.stripe.com> → make sure the **Live mode** toggle is on
   (top right), because the Broken Map link is a live link.
2. **Developers → Webhooks → Add endpoint** (in the newer dashboard:
   **Workbench → Webhooks → Add destination**).
3. Endpoint URL: `https://supremesynergy.org/api/stripe-webhook`
4. Events: select exactly these two
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
5. Add the endpoint. On its page, under **Signing secret**, click **Reveal**
   and copy the `whsec_...` value.

## Step 4 — Tell Vercel the secrets (5 minutes)

<https://vercel.com> → the **supremesynergy** project → **Settings →
Environment Variables**. Add each for **all environments**:

| Name | Value |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | the `whsec_...` from Step 3 |
| `RESEND_API_KEY` | the `re_...` from Step 1 |
| `REPLY_TO` | the inbox you read; replies to the delivery email go here |
| `DELIVERY_BCC` | the same inbox; a copy of every delivery lands there |

Optional:

| Name | Value |
|---|---|
| `RESEND_FROM` | defaults to `Braxton Luke <braxton@supremesynergy.org>`. Any name at the verified domain works; it does not need to be a real mailbox because replies go to `REPLY_TO`. |
| `BROKEN_MAP_PAYMENT_LINK` | the `plink_...` id of the Broken Map link (Stripe → Payment Links → the link → the id in the URL). Set this once a second product exists, so only Broken Map purchases get this email. |
| `SHEET_WEBHOOK_URL`, `SHEET_SECRET` | from `SETUP-EMAIL-CAPTURE.md`. Not set as of 2026-09-22, so buyers are not written to the sheet yet. When set, each buyer is one row with source `broken-map-buyer`, and the homepage door starts working too. |

Then **Deployments → the top one → ⋯ → Redeploy**. Variables only apply to
deployments made after they are added.

## Step 5 — Test it with a real checkout (5 minutes)

Cheapest way, a 100% promotion code:

1. Stripe → **Product catalog → Coupons → New**: 100% off, duration once.
   Under the coupon, **Add promotion code**: `FOUNDERTEST`, max 1 redemption.
2. **Payment Links → the Broken Map link → Edit → Allow promotion codes** on
   → Save.
3. Open <https://supremesynergy.org/broken-map>, click buy, enter the code,
   use your own email, complete the $0 checkout.
4. Turn **Allow promotion codes** back off.

Or buy it for $37 with your own card and refund yourself in Stripe. Stripe
keeps its fee on a refund, about $1.40.

Then check three places:

- Your inbox: "Your copy of The Broken Map" arrived at the checkout address,
  and the BCC copy arrived too. Check spam the first time.
- Stripe → the endpoint page → recent deliveries show **200**.
- Vercel → project → **Logs**, filter `/api/stripe-webhook`: a line starting
  `[stripe-webhook] delivered`.

If Stripe shows a 400: the signing secret in Vercel does not match the
endpoint. If it shows a 500: read the Vercel log line, it names the missing
variable or the Resend error.

## Step 6 — Deliver to the buyers who came before this

> Done 2026-09-22: the four buyers from Sept 21 were emailed by hand from
> supremesynergy777@gmail.com. Kept for the record.

Stripe's **Resend** button only appears on an event that already has a
delivery attempt to the destination. Purchases made before the destination
existed have none, so the button is not there, and the Workbench shell is
read-only in live mode. Two routes for those:

- **By hand.** Stripe → Payments → each payment → copy the customer email.
  Send them the same text the function sends (the `text` block in
  `buildEmail`, `api/stripe-webhook.mjs`) from the inbox in `REPLY_TO`.
- **Stripe CLI** (events up to 30 days old). Install with
  `brew install stripe/stripe-cli/stripe`, run `stripe login` and approve it
  in the browser, then per event:

  ```bash
  stripe events resend evt_XXXXXXXX --webhook-endpoint we_1UILg6EuLudATZzlyNyaFy2x
  ```

  The second id is the broken-map-delivery destination. Each session sends
  once no matter how many times it is replayed.

For any purchase made after the destination went live, nothing to do: the
email went out on its own, and a copy is in the `DELIVERY_BCC` inbox.

---

## Changing the email

The words live in `api/stripe-webhook.mjs`, in `buildEmail`. Edit, run the
test, push:

```bash
cd ~/Code/supremesynergy.org && node scripts/test-stripe-webhook.mjs
```

The test never touches the network. It checks the signature logic, the
routing of paid, unpaid and promo-code sessions, the email contents, and that
a failed send returns 500 so Stripe retries.

## Adding a second product

Each Stripe Payment Link has an id (`plink_...`). Add a product block in
`api/stripe-webhook.mjs` next to `BROKEN_MAP`, route on `session.payment_link`
in `productForSession`, and set `BROKEN_MAP_PAYMENT_LINK` so the two never
cross.
