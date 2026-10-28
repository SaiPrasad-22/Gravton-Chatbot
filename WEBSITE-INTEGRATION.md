# Add Gravton chat to an existing website

## Embed the hosted widget

First deploy and test the full Gemini project on Vercel. Use a stable production domain that website visitors can access.

Add this once, immediately before the closing `</body>` tag (or your CMS's footer/custom-script area):

```html
<script src="https://YOUR-CHATBOT.vercel.app/embed.js" defer></script>
```

Replace the example domain. No other files or secret keys need to be copied into the host website. The iframe isolates chatbot styling from your site's CSS. The closed frame is limited to the launcher area and expands when the widget opens. The existing guided enquiries and WhatsApp actions work inside the widget.

The host page loads `embed.js` and an iframe from your chatbot domain. The iframe calls `/api/chat` and `/api/lead` on that same chatbot domain, so the backend's same-origin rule remains in place. Only open/closed state and desktop/mobile layout are exchanged using `postMessage`; chat messages and enquiry answers are not sent to the host page.

If your website has a Content Security Policy, allow the chatbot domain in `script-src` and `frame-src`. If you configure a `frame-ancestors` policy for the chatbot, allow your website's exact origin. Check visitor access if you have Vercel deployment protection enabled. A script-blocking CMS may require its approved custom-code integration.

After adding the snippet, check open/close, page links when closed, a real AI answer, test ride, dealership, showroom and WhatsApp opening on desktop and mobile. This package was checked in a browser, not on a physical phone or in your CMS.

## With the Gravton 3D website

The Gravton website has a build-time switch. Build it with the chatbot's address and it loads this `embed.js` at idle time (after the page has loaded) instead of its built-in WhatsApp assistant, never both:

```
GRAVTON_CHATBOT_URL=https://YOUR-CHATBOT.vercel.app npm run build
```

Without the setting the website keeps its built-in assistant, exactly as before. Rebuild the website only when the chatbot's address changes; chatbot updates are deployed on Vercel and need no website change.

## Integrate React directly instead

For a React website, copy `src/components/chat`, `src/features`, `src/services`, `src/config`, `src/config.ts`, `src/shared`, `shared` and `public/assets`. Import `src/styles/original.css`, `chat.css` and `enhancements.css` (in that order) and render `<Widget />` from `src/components/chat/Widget.tsx` once. Deploy both `api/chat.ts` and `api/lead.ts`, plus `server` and `shared` on the host origin, installing the matching dependencies. Keep the root ID `gravton-chatbot-widget` unique. Adjust absolute `/assets/`, `/api/chat` and `/api/lead` paths if your website uses subpath routing.

The script/iframe option requires less coupling and lets you update the chatbot independently of your website.

## Lead details and privacy

The iframe reuses contact details within the current page session. Refreshing the page clears them. The server validates details but there is no CRM, durable storage or automatic sales notification. Keep your website privacy wording consistent with this behavior. Contact fields are not automatically sent to Gemini; chat messages are. The visitor reviews and sends any WhatsApp message.
