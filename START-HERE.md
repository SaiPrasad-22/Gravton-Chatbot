# Start here — five-document knowledge update

This is the updated source for your existing Gemini chatbot. All five supplied documents have been reviewed and imported into the bundled server knowledge index. You do not need to upload them separately to use this version. Read KNOWLEDGE-REVIEW.md for coverage and conflicting specifications.

## Update your existing Vercel project

1. Extract this ZIP and open the `gravton-chatbot-gemini` folder.
2. Replace your previous project source with this version, or deploy this folder to the same Vercel project using your existing Git/CLI workflow. Keep a copy of your previous source for rollback.
3. Keep your existing Vercel environment variables: `GEMINI_API_KEY` and `GEMINI_MODEL`. The model remains `gemini-3.5-flash-lite`. No new variables or database migrations are required.
4. Build and deploy the full source: Vite preset, build `npm run build`, output `dist`, Node.js 22 or newer. The root must contain `package.json`, `api`, `server`, and `shared`. Uploading only `dist` cannot run AI or validate lead details.
5. Test the new deployment: enter a 10-digit mobile number, ask a range/charging question, try EMI, then a test-ride enquiry. See TEST-RESULTS.md for checks and limits.

Your existing live deployment has not been changed automatically. A new source deployment is required; redeploying the old source will not add this update.

## Test locally

Use Node.js 22 or newer. Run these commands inside the extracted folder:

```sh
npm ci
npm run setup
```

Open `.env` beside `package.json` and replace only the key placeholder:

```dotenv
GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.5-flash-lite
```

Then run:

```sh
npm run dev
```

Open http://localhost:4173. Restart after changing `.env`. A local `.env` does not configure Vercel. Never put a key in React, HTML, `embed.js`, or a variable starting with `VITE_`.

## What is included

- Mobile number first, followed by AI questions; optional name/city later.
- Shared enquiry details across AI, test ride, dealer and showroom flows.
- EMI starting from ₹3,000/month, subject to eligibility and the applicable plan.
- Source-linked reviewed answers from all five documents, with a sales fallback for unknown or conflicting information.
- Dark Continue/Start buttons, compact navigation and the existing WhatsApp contact.

**Lead storage limit:** Details are validated on the server and retained only in the current page session. There is no CRM/database or automatic sales notification. Refreshing clears the session. Visitors must send the prepared WhatsApp message themselves.

## Repackage after local edits

```sh
npm run zip
```

This creates `release/Gravton-Chatbot-Knowledge-Deploy.zip`, excluding private `.env` files and `node_modules`. Extract before deployment. Run `npm run setup` again if a local `.env` is needed.

## Add to your website later

Keep this project deployed on a stable public chatbot domain. Add this before `</body>`, replacing the example domain:

```html
<script src="https://YOUR-CHATBOT.vercel.app/embed.js" defer></script>
```

No API key goes in this snippet. See WEBSITE-INTEGRATION.md. The new version still needs a live Gemini check with your configured key and available quota after deployment.
