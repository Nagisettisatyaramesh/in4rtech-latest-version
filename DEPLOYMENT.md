# In4rtech website — deployment notes

Static site (`index.html`, `insights.html`, `privacy.html`, `assets/`) plus one Vercel serverless function (`api/contact.js`).

## Contact form (sends email directly)

The form posts to `/api/contact`, which emails the enquiry via [Resend](https://resend.com).
No email address appears in the website code.

Set these in **Vercel → Project → Settings → Environment Variables**, then redeploy:

| Variable | Required | Example |
|---|---|---|
| `RESEND_API_KEY` | yes | `re_xxxxxxxx` |
| `CONTACT_TO` | yes | the inbox that should receive enquiries |
| `CONTACT_FROM` | recommended | `In4rtech Website <website@in4rtech.com>` (verify the domain in Resend first) |

Without `CONTACT_FROM`, Resend's test sender is used, which only delivers to the Resend account owner's address.

The form includes a hidden honeypot field to reduce spam. `/api/contact` does not run under a plain static server (e.g. `python -m http.server`); use `vercel dev` or a Vercel preview deployment to test sending.

## Analytics and cookie banner

`assets/consent.js` shows the cookie banner and only loads analytics after the visitor accepts.
To enable Google Analytics 4, set `CONFIG.gaId` in `assets/consent.js` to the measurement ID (e.g. `G-XXXXXXXXXX`).
If you use a different analytics provider, update the loader in that file and section 4/6 of `privacy.html`.

## Privacy policy — items to complete

In `privacy.html`, replace the highlighted placeholders: company number, registered office, ICO registration number,
and confirm the hosting, email and analytics providers and the retention periods.
