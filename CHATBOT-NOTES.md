# Gravton AI chatbot: merged version

## What this is
One project that joins the two supplied ones:
- **Interface (Project A, "Gravton Chatbot UI Updated"):** used as supplied. Launcher, main menu, Test Ride, Dealer, Quanta pages, Find a Showroom, guided flows with review, chat screen. Its stylesheets are unchanged; the launcher, main menu and first guided-flow step render identically to Project A (0.000% to 0.05% of pixels differ; the small residue is the logo, now a small WebP).
- **Functionality (Project B, "gravton-chatbot-gemini"):** the Gemini integration, the knowledge base (79 reviewed answer records from 5 documents), the retrieval and answer-selection design, validation, rate limiting and the embed loader. Project A is a UI-only preview with canned answers; those are gone, and its chat screen now talks to the real server.
- **Earlier refinements kept:** customer answers carry no document names or page numbers (internal citations are still checked), reworded answers with their facts guarded by a test, "where did you get that?" answered with public titles only, a plain "busy" message for rate limits.

## What is new in the merge
- A real mobile-number step before the AI chat (Project B's validation, in Project A's style), with a working "Edit details".
- Follow-up questions and a suggested next action (Book a Test Ride, Become a Dealer, Find a Showroom) chosen from the reviewed records an answer came from. No extra Gemini request.
- Unanswered questions: the assistant says the sales team can help and shows a Talk to Sales on WhatsApp button whose message already contains the visitor's question. The visitor presses send; nothing is sent automatically.
- A new answer opens at its first line, so a long answer never starts mid-text.
- Short screens (keyboard open, landscape): the heading and tool row step aside and the message box stays under the messages.
- The widget tells the website's frame when it opens and closes (as before), so the host page keeps working around it.

## Environment variables (names only)
`GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-3.5-flash-lite`). Server side only: set them in Vercel (Settings, Environment Variables). Nothing is read by the browser; the browser bundle was checked and contains no key. No `.env` file is included in this package: copy `.env.example` to `.env` for local use only.

## How to change things
- **What visitors read on the AI chat screen:** `src/config/chat-copy.ts`.
- **WhatsApp number, links, launcher timing:** `src/config.ts` (the number `917995252220` / +91 79952 52220 is the one in Project A's supplied configuration, and is the same number as on the website).
- **What the assistant knows:** `server/knowledge/records.ts` and `server/knowledge/sources.json`; run `npm run knowledge:check` after editing. A test checks that facts do not change by accident.
- **How Gemini behaves:** `server/config/prompt.ts`.
- **Suggested follow-ups and next actions:** `server/config/follow-ups.ts` (a test checks each suggestion can be answered).
- **Guided forms and Quanta pages:** `src/features/*` and `src/data/quanta.ts`.

## Run, test, deploy
```
npm install
npm run dev            # local, http://localhost:4173 (add your key to .env first)
npm test               # 77 tests
npm run knowledge:check
npm run build
npm run zip            # source package without secrets
npm run test:live      # real Gemini check, needs your key; run it once after deploying
```
Deploy the project to Vercel as before (it is a Vite site plus the serverless functions in `api/`). Then give the website the address: see WEBSITE-INTEGRATION.md.

## Tests performed
- 77 automated tests pass: server contract, knowledge, customer answers, follow-ups and hand-off, lead validation, and the interface driven against a mocked server (mobile step, Backspace, Delete and paste handling, asking, double Enter, loading, errors, retry without duplicates, rate limit, hand-off, restart, back, close, menu actions).
- Browser: layout at 320, 375, 390, 430, 768, 1440 and 1920 px with a long answer, and at five short keyboard-open heights; no sideways overflow; close button and message box always reachable.
- Embedded in the website's frame at 1440, 1280, 390 and 320 px: closed and open sizes, launcher and panel inside the frame, 20 px clearance from the website's back-to-top button, a question asked and answered through the frame.
- No API key in the browser bundle or public files.

## Not tested
Real Gemini answers (no network in the test environment: run `npm run test:live`), real phones and their keyboards, Safari and Firefox, the deployed Vercel site, and the chatbot on the live website. Project A auto-opens the launcher about 3.5 seconds after load and closes it again if untouched: this is its supplied behaviour, kept.
