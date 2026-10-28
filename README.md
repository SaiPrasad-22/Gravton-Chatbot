# Gravton chatbot — Version 16 (knowledge update 3.0 + refinements; see CHATBOT-V16-NOTES.md)

React, TypeScript and Vite with Vercel server functions and the existing official `@google/genai` provider. Begin with START-HERE.md. This updates the previous working Gemini source; it does not modify the live Vercel project automatically.

## Setup and verification

Use Node.js 22 or newer. Run `npm ci`, `npm run setup`, set the private key in `.env`, and run `npm run dev`. The development server runs the UI plus `/api/chat` and `/api/lead` at http://localhost:4173. `npm run preview` serves only built static files, not the API functions.

| Variable | Purpose |
| --- | --- |
| GEMINI_API_KEY | Existing private Gemini Developer API key; server only |
| GEMINI_MODEL | Existing model; default `gemini-3.5-flash-lite` |

No new environment variables or database migrations are needed. Vercel uses its own project environment variables. Deploy the full project with the Vite preset, `npm run build`, output `dist`, and Node.js 22 or newer. Keep keys out of `VITE_` variables and frontend files.

```sh
npm run knowledge:check
npm test
npm run build
npm run zip
```

After deploying with your key, optionally run `npm run test:live -- https://YOUR-CHATBOT.vercel.app`. It sends ten synthetic questions, consumes provider quota, and may incur charges on a paid project. It is not run automatically. Inspect relevance and source references as well as the script's checks.

## Five-document retrieval

The previous source had a short fact list, no Google File Search store ID and no document-upload/retrieval code. This release therefore bundles a reviewed server index built from all five supplied documents. No Google File Search store was created or claimed to be verified.

`server/knowledge/sources.json` contains 79 source sections from the 78 PDF pages and the DOCX. `manifest.json` records filenames and original file hashes. `records.ts` contains 79 reviewed answer units with source references. Original PDFs/DOCX were not modified; their extracted text and reviewed records are included instead of duplicating the large originals.

For each question the server retrieves candidate records by topic matching. Gemini chooses up to three supported answer IDs using a constrained JSON response. The server rejects malformed, unknown or duplicate IDs and returns only stored reviewed prose with source labels. It never displays arbitrary model-generated prose. No candidates, unsupported selection, known conflicts or service failures produce the sales fallback. EMI uses the separately supplied starting amount.

This is conservative retrieval, not exhaustive semantic search. Unusual paraphrases, mixed questions and unsupported languages can be declined; reviewed answers are English. Semantic relevance of Gemini's selected IDs still needs live checking. The implementation prevents new model-written specifications but does not guarantee every selection is relevant. It does not browse the web, execute tools or infer current prices. See KNOWLEDGE-REVIEW.md before changing facts.

## Mobile-first enquiries

The AI UI requires a server-validated 10-digit mobile number. Paste strips spaces and a complete +91/0091 prefix; overlong numbers remain invalid instead of being silently truncated. Normal editing, selection and keyboard navigation are supported. Name and city appear after two useful answers or an EMI/purchase/sales enquiry; visitors can skip and continue. Details can be edited and reused across guided flows.

`/api/lead` validates a structured object and returns `accepted: true, persisted: false, notified: false`. It does not save a lead remotely. One browser-memory object keeps the original source, conversation ID and creation time while later details update it. Concurrent and unchanged submissions are suppressed. There is no CRM, database, localStorage or application PII logging. A page refresh ends this session. A future CRM adapter must implement authenticated durable upsert/idempotency, consent and truthful persistence acknowledgements before claiming saved leads or automatic follow-up.

Mobile entry is a UI enquiry step, not authentication, OTP verification or proof of phone ownership. `/api/chat` remains a public endpoint. Contact fields are not automatically sent to Gemini; typed chat text and recent conversation are. Infrastructure providers may retain their own request metadata under their configuration. The app does not record marketing consent: `consentStatus` stays `not-requested`.

WhatsApp stays `917995252220`. The widget previews an encoded message and opens WhatsApp only on visitor action. It never sends the message or confirms a booking. The AI sales message omits the mobile number; guided enquiries retain their existing user-reviewed contact fields.

## Failure behavior

Customers receive: “Sorry, I don't have this information right now. Please talk to our Gravton sales team on WhatsApp for assistance.” The visible WhatsApp action stays available. Exact EMI requests receive the specific approved finance response instead of a calculation.

| Safe API code | Check |
| --- | --- |
| AI_NOT_CONFIGURED | Local placeholder/restart or Vercel variables/redeploy |
| AI_CREDENTIAL_INVALID | Rejected/expired key |
| AI_ACCESS_UNAVAILABLE / AI_CONFIGURATION_ERROR | Project, key restrictions, region and model access |
| AI_QUOTA_LIMIT | Provider quota; repeated retries may not help |
| AI_TIMEOUT / AI_UPSTREAM_ERROR | Provider availability; retry later |
| AI_RESPONSE_BLOCKED / AI_INCOMPLETE_RESPONSE | Rephrase or contact sales |

API responses validate JSON, roles and sizes, reject cross-origin browser requests and set no-store. The request timeout remains 25 seconds with one provider attempt. The best-effort limiter allows 12 requests per minute per warm server instance; it is not a shared usage cap. Same-origin checks are not authentication. Existing production protections and provider quotas remain the deployment owner's responsibility.

## Source guide

This project merges two supplied projects: the interface comes from "Gravton Chatbot UI Updated" (Project A) and the Gemini server, knowledge base and lead validation from "gravton-chatbot-gemini" (Project B). See CHATBOT-NOTES.md for how to change each part.

- `src/components/chat`, `src/styles/original.css`, `src/styles/chat.css`: the supplied interface (launcher, main menu, guided flows, Quanta pages, chat screen). `src/styles/enhancements.css` only adds short-screen (keyboard open) rules and answer paragraph breaks.
- `src/features/conversation/useChat.ts`: the chat logic (send, retry, restart, loading, errors) calling `/api/chat`. `src/services/chat.ts` is the request and response check.
- `src/config/chat-copy.ts`: customer-facing wording of the AI chat screen. `src/config.ts`: WhatsApp number, links, launcher timing.
- `src/features/leads`, `src/components/chat/LeadGate.tsx`, `shared/lead.ts`, `server/lead.ts`, `api/lead.ts`: the mobile-number step and its validation.
- `shared/chat-contract.ts`: what `/api/chat` returns (answer, follow-up questions, next action, hand-off flag) and the starter questions.
- `server/knowledge*`, `server/knowledge/records.ts`, `shared/messages.ts`: the knowledge base, retrieval, conflict rules and the approved EMI and fallback text.
- `server/config/prompt.ts`, `server/providers/gemini.ts`, `server/chat.ts`, `api/chat.ts`: Gemini's instructions, the provider call, request handling and answer selection. `server/enrich.ts` and `server/config/follow-ups.ts` add follow-up questions and the next action without any extra Gemini call.
- `public/embed.js`: the loader that puts the chatbot on a website. WEBSITE-INTEGRATION.md explains it.
- `tests`, `scripts/check-knowledge.ts`: regression and knowledge checks.
- UPDATE-REPORT.md, TEST-RESULTS.md, KNOWLEDGE-REVIEW.md: reports from earlier versions of Project B (kept for the record; they describe its previous interface).
