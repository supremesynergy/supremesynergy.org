# Namecheap DNS Setup: supremesynergy.org

The Vercel project is **live** and the domain is **attached**. The only thing missing is pointing Namecheap's DNS at Vercel.

## Step-by-step (5 minutes)

### 1. Sign in to Namecheap
- Go to https://www.namecheap.com → sign in
- Click **Domain List** in the left sidebar
- Find `supremesynergy.org` → click **Manage**

### 2. Switch to Namecheap BasicDNS (if not already)
- Click the **Nameservers** tab
- Confirm it's set to **Namecheap BasicDNS** (or PremiumDNS), NOT "Custom DNS" or a third-party.
- If it shows third-party nameservers, change to Namecheap BasicDNS and save.

### 3. Open Advanced DNS
- Click the **Advanced DNS** tab

### 4. Delete any conflicting default records
Namecheap usually pre-fills two records that will conflict with Vercel:
- **CNAME** record with Host `www` pointing to `parkingpage.namecheap.com` → **DELETE**
- **URL Redirect Record** with Host `@` pointing to `http://www.supremesynergy.org/` → **DELETE**

(If either does not exist, skip it.)

### 5. Add the two Vercel records

Click **Add New Record** and create each of these:

| Type     | Host | Value              | TTL       |
|----------|------|--------------------|-----------|
| A Record | `@`  | `76.76.21.21`      | Automatic |
| A Record | `www`| `76.76.21.21`      | Automatic |

Save (the green checkmark on each row).

### 6. Wait for propagation
- Propagation typically takes **5-30 minutes** but can take up to 48 hours.
- You'll get an email from Vercel when verification succeeds and SSL is issued (~5-30 min after DNS resolves).

### 7. Verify
Once DNS resolves, both of these should load the landing page with a valid HTTPS certificate:
- https://supremesynergy.org
- https://www.supremesynergy.org

You can also run this to check propagation:
```
dig supremesynergy.org +short
dig www.supremesynergy.org +short
```
Both should return `76.76.21.21`.

---

## Alternative: CNAME for www (slightly more flexible)

If you prefer Vercel to manage the www subdomain via CNAME (which means they can change the underlying IP without you needing to update DNS), use this instead of the second A record:

| Type  | Host | Value                  | TTL       |
|-------|------|------------------------|-----------|
| CNAME | `www`| `cname.vercel-dns.com.`| Automatic |

Both approaches work. The A-record version above is what Vercel's CLI recommended, simpler and matches the apex configuration.

---

## Already done on the Vercel side

For reference, you don't need to do these. They're already set up:

- ✅ Vercel project `supremesynergy` created under `supremesynergy-s-projects`
- ✅ Production deployment live at https://supremesynergy.vercel.app
- ✅ Domain `supremesynergy.org` attached to the project
- ✅ Domain `www.supremesynergy.org` attached to the project
- ✅ Security headers configured in `vercel.json`

---

## After DNS propagates: GitHub auto-deploy (optional follow-up)

Currently the site deploys via `vercel deploy --prod` from your local machine. To enable automatic deploys from GitHub pushes:

1. Authenticate GitHub CLI: `gh auth login --web` (in your own terminal, since device flow needs you to authorize)
2. Push the local commits: `cd ~/Code/supremesynergy.org && git push -u origin main`
3. In Vercel dashboard → project settings → Git → connect GitHub → select `supremesynergy/supremesynergy.org`

Then every `git push` to `main` auto-deploys.
