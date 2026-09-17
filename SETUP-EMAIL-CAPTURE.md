# Email capture setup (about 10 minutes, one time)

The homepage form posts to `/api/subscribe`, which appends one row to a Google
Sheet. That Sheet is the list. Export it any time with **File → Download →
Microsoft Excel (.xlsx)**.

Nothing here costs money and there is no vendor account to create.

---

## Step 1 — Make the Sheet

1. Go to <https://sheets.new> while signed in as the account that should own
   the list.
2. Name it something like **Supreme Synergy — Email Capture**.
3. In row 1, put these five headers, one per column, A through E:

   | A | B | C | D | E |
   |---|---|---|---|---|
   | Timestamp | Email | Source | Referrer | User Agent |

---

## Step 2 — Add the script

1. In that Sheet: **Extensions → Apps Script**. A code editor opens.
2. Delete whatever is in there and paste this in full:

```javascript
// Appends one row per signup. Deployed as a web app, called by /api/subscribe.
var SECRET = 'PASTE_YOUR_SECRET_HERE';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (!SECRET || body.secret !== SECRET) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Answers from the thank-you page question go to their own tab.
    if (body.type === 'answer') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var tab = ss.getSheetByName('Answers');
      if (!tab) {
        tab = ss.insertSheet('Answers', ss.getSheets().length);
        tab.appendRow(['Timestamp', 'Email', 'Answer', 'Detail']);
      }
      tab.appendRow([
        body.timestamp || new Date().toISOString(),
        String(body.email || '').trim().toLowerCase(),
        String(body.answer || ''),
        String(body.detail || '')
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, answered: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'no email' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Skip addresses already on the list.
    var existing = sheet.getRange('B:B').getValues();
    for (var i = 0; i < existing.length; i++) {
      if (String(existing[i][0]).trim().toLowerCase() === email) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, duplicate: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    sheet.appendRow([
      body.timestamp || new Date().toISOString(),
      email,
      body.source || '',
      body.referrer || '',
      body.userAgent || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Make up a long random string (mash the keyboard, 30 or so characters) and
   put it in place of `PASTE_YOUR_SECRET_HERE`. Keep a copy, you need it again
   in Step 4.
4. Save (the disk icon).

---

## Step 3 — Deploy the script

1. Top right: **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** **Anyone**
4. **Deploy.** Google asks you to authorize. Approve it. On the "Google hasn't
   verified this app" screen, click **Advanced → Go to (project name)**. This
   is your own script, that warning is expected.
5. Copy the **Web app URL**. It ends in `/exec`. You need it in Step 4.

> If you ever edit the script, you must **Deploy → Manage deployments → edit →
> Version: New version → Deploy** for the change to go live. Editing alone does
> nothing to the live URL.

---

## Step 4 — Tell Vercel about it

1. <https://vercel.com> → the **supremesynergy.org** project → **Settings →
   Environment Variables**.
2. Add two, both for **all environments**:

   | Name | Value |
   |---|---|
   | `SHEET_WEBHOOK_URL` | the `/exec` URL from Step 3 |
   | `SHEET_SECRET` | the same random string from Step 2 |

3. **Redeploy** so the new variables are picked up: **Deployments → the top
   one → the ⋯ menu → Redeploy**. Environment variables do not apply to
   deployments that already exist.

---

## Step 5 — Test it

1. Open <https://supremesynergy.org> in a private window.
2. Put in an address you control and submit.
3. You should land on `/thanks`.
4. Check the Sheet. A row should be there.

If you land on `/thanks` but no row appears, the function could not reach the
script. Check Vercel → the project → **Logs**, and confirm both environment
variables are set and that the deployment is newer than they are.

---

## The download

`/thanks` links to `/downloads/sim-one-page.pdf`. Put the file in the
`downloads/` folder with that name, or rename it and update the `href` in
`thanks.html` (it is inside a marked comment block).

**Until that file exists, the download button 404s.** That is the one thing
standing between this and being live.

---

## Step 6 — Save the thank-you page answers (about 3 minutes, one time)

`/thanks` asks one question: *What broke the official story for you?* A tap
posts to `/api/answer`, which sends it to the same Apps Script. If your
script was set up before this step existed, it does not know what to do
with answers yet. Add one block:

1. Open the capture Sheet → **Extensions → Apps Script**.
2. Find the line that starts with `var email =`.
3. Paste this block **directly above** that line. Do not touch the `SECRET`
   line or anything else.

```javascript
    // Answers from the thank-you page question go to their own tab.
    if (body.type === 'answer') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var tab = ss.getSheetByName('Answers');
      if (!tab) {
        tab = ss.insertSheet('Answers', ss.getSheets().length);
        tab.appendRow(['Timestamp', 'Email', 'Answer', 'Detail']);
      }
      tab.appendRow([
        body.timestamp || new Date().toISOString(),
        String(body.email || '').trim().toLowerCase(),
        String(body.answer || ''),
        String(body.detail || '')
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, answered: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
```

4. Save.
5. **Deploy → Manage deployments → the pencil (edit) → Version: New version →
   Deploy.** The `/exec` URL stays the same, so nothing changes in Vercel.
6. Test: sign up at <https://supremesynergy.org> in a private window, tap an
   answer on the thank-you page, and check the Sheet. A new tab called
   **Answers** appears with one row.

**What the codes mean** (column C of the Answers tab):

| Code | Button |
|---|---|
| `religion` | The religion I grew up in |
| `science` | Science that stopped adding up |
| `experience` | An experience science could not explain |
| `health` | A health or medical experience |
| `success` | Success that felt empty |
| `growth` | Personal growth work that did not stick |
| `other` | Something else (their words are in column D) |

**Before this step is done,** answers are not lost completely. Each one is
also written to Vercel → the project → **Logs** (answer and detail only, no
email), but Vercel keeps logs only briefly, so do Step 6 soon.

---

## Notes

- **The honeypot.** The form has a hidden field named `website`. People never
  fill it in, bots fill in everything. Anything that fills it gets a success
  response and is silently dropped.
- **Duplicates.** The script skips an address already in column B, so someone
  submitting twice does not create two rows.
- **Volume.** Apps Script allows far more calls per day than this will see.
  It is not a concern at sprint scale.
- **Swapping the destination later.** If the list moves to Substack, Kit, or
  anything else, only `api/subscribe.js` changes. The page and the thank-you
  page stay as they are.
