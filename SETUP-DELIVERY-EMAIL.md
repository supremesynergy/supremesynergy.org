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

1. Go to <https://resend.com> and create an account with the email you read.
2. **Domains → Add Domain** → `supremesynergy.org` → region can stay default.
3. Resend shows DNS records to add. Open a second tab: Namecheap → Domain List
   → `supremesynergy.org` → **Manage → Advanced DNS → Add New Record**, and
   copy each record Resend shows. The usual three:

   | Type | Host (Namecheap) | Value | Note |
   |---|---|---|---|
   | TXT | `resend._domainkey` | the long `p=...` value | DKIM |
   | MX | `send` | `feedback-smtp.<region>.amazonses.com`, priority 10 | SPF |
   | TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF |

   Resend shows the full host name; in Namecheap you type only the part before
   `.supremesynergy.org`. Copy the values exactly from the Resend screen, not
   from this table. Leave the two existing A records for Vercel alone.
4. Back in Resend, click **Verify DNS Records**. It can take a few minutes.
   Wait for the green "Verified".
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

## Step 6 — Deliver to the buyers who came before this (2 minutes each)

Stripe can replay a past event through the new endpoint, and the email goes
out as if they had just bought.

1. Stripe → **Developers → Events** (or **Workbench → Events**), find the
   `checkout.session.completed` event for that purchase.
2. Open it → **Resend** (or "Send to endpoint") → choose
   `supremesynergy.org/api/stripe-webhook`.

Do this for the reader who texted, and for every other buyer so far. Each
session sends once no matter how many times it is replayed.

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
