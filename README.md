# KeceLabs — Website

Static marketing site for KeceLabs (Build. Automate. Scale.). Plain HTML, CSS and a small vanilla JS file. No build step.

## Files
| File | Purpose |
|---|---|
| `index.html` | Homepage (hero, problems, services, interactive Lead Response System demo, process, industries, contact form) |
| `privacy.html`, `terms.html` | Legal pages (drafts; see "Before launch") |
| `thanks.html` | Success page used when the form is submitted without JavaScript |
| `404.html` | Not-found page (Netlify serves it automatically) |
| `styles.css` | Entire design system (tokens at the top of the file) |
| `script.js` | Mobile menu, section links, scroll reveal, footer year, Lead Response demo, form validation + AJAX submission |
| `netlify.toml` | Publish root, security/cache headers, friendly legal redirects |
| `favicon.svg`, `apple-touch-icon.png`, `og-image.png`, `robots.txt` | Icons, social preview, crawler rules |

## Interactive demo
The Lead Response System demo (`initDemo` in `script.js`) is a scripted simulation that runs entirely in the browser:
no network requests, no AI/SMS/phone APIs, no serverless functions, and no input fields, so it has no per-use cost
and collects no data. All names and numbers are fictional (555-01xx numbers are reserved for fiction).
To change the wording, edit the `steps`, `log` and message text in the `SCENARIOS` object.
If real integrations are added later, keep their credentials in server-side functions, never in frontend JavaScript.

## Run locally
```bash
python3 -m http.server 8080   # then open http://localhost:8080
```
Form submissions only work on Netlify. Locally the form shows its error state on submit, which is expected.

## Deploy to Netlify
1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Leave the build command empty. The publish directory is `.` (it's set in `netlify.toml`).
4. Deploy, then add your custom domain under **Domain management**.

## Verify Netlify Forms
1. After the first deploy, open **Site → Forms**. A form named **`contact`** should be listed. If it isn't, enable form detection under **Site configuration → Forms** and redeploy.
2. Submit a test on the live site. You should see the inline "Message received." panel.
3. Check that the submission appears under **Forms → contact** (look in "Spam submissions" too).
4. Add email notifications: **Site configuration → Forms → Form notifications → Add notification → Email notification**, sending to hello@kecelabs.com.

## Before launch
- Replace every `https://REPLACE-WITH-DOMAIN` (canonical + Open Graph tags on all pages) with the real domain.
- Confirm `hello@kecelabs.com` mailbox exists.
- Have Privacy Policy and Terms reviewed by a lawyer; add governing law, legal entity name and mailing address; name the email/SMS providers in the Privacy Policy.
- Update the "Last updated" date in `privacy.html` / `terms.html` when they change.
- When you edit `styles.css` or `script.js`, bump the `?v=` number in each page's `<link>` and `<script>` tags.
