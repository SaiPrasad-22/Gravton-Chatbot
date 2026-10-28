# Verification — 25 October 2026

## Executed checks

- `npm test`: **63 tests passed across 7 files**.
- `npm run knowledge:check`: **5 documents, 79 indexed sections, 79 reviewed answer records**; every reference resolves and all documents contribute answers.
- `npm run build`: TypeScript checking and Vite production build passed. Rollup removed two harmless third-party Zod comment annotations; no build failure.
- Both Vercel API entrypoints bundled successfully with esbuild for Node ESM, keeping package dependencies external.
- `npm audit --omit=dev`: zero reported production-dependency vulnerabilities at check time. This is not a general security guarantee.
- Client JavaScript inspected: private provider key variable and server source corpus are absent.
- Release packaging scans text sources for likely credentials and excludes populated `.env`, dependency, build and temporary QA files.

## Test coverage

| Test file | Tests | Coverage |
| --- | ---: | --- |
| api.test.ts | 12 | Request method/origin/JSON/history/size limits, provider failures and safe responses |
| configuration.test.ts | 5 | Existing provider configuration, setup, deployment conventions and embed behavior |
| sdk.test.ts | 3 | Official SDK request shape and private authentication header, constrained candidate selection, blocked/truncated responses |
| knowledge.test.ts | 26 | All five sources, retrieval, conflicting/unknown information, EMI, malformed or forged answer IDs, model separation and follow-ups |
| lead-api.test.ts | 3 | Server field validation, size/origin handling, non-persistent acknowledgement and update/retry requests |
| leads.test.tsx | 6 | Phone keyboard/paste/editing cases, mobile-first gate, duplicate lock, failure behavior, optional details, cross-flow reuse and HTTP-preview UUID fallback |
| flows.test.tsx | 8 | Test ride/dealer/showroom paths, back/edit/review, encoded WhatsApp handoff, AI retry/cancel/context and safe text rendering |

Provider responses in automated tests are mocked. A passing SDK test proves the request/response handling under that mock, not successful authentication against Google.

## Browser checks

Checked the local implementation in Chromium at desktop size and inside a 390 × 844 CSS-pixel iframe:

- Logo, header, close icon, launcher and mobile-first screen render.
- Invalid/empty mobile leaves Start Chat disabled; a synthetic valid number unlocks questions.
- Accepted number is masked and skipped when entering the test-ride flow.
- Model choice and dark Continue button remain clear; Back/Main menu are compact.
- Narrow-screen quick replies wrap and the composer/WhatsApp action remain usable.
- Missing local Gemini configuration produces the required sales fallback, retry and ask-another controls.

The browser check found an HTTP-preview startup error because `crypto.randomUUID` was unavailable. A cryptographic `getRandomValues` fallback fixed it, with a regression test. No production customer contact data was used and no WhatsApp message was sent.

## Not verified in this release

- A real Gemini response with the customer's key, quota and model access. No Gemini credential was used here.
- The updated source on the user's Vercel deployment; deployment is still required.
- A Google File Search store: none existed in the supplied source. This release uses the bundled reviewed index.
- CRM/database persistence or notifications: not configured or claimed.
- A physical iOS/Android keyboard, every browser, the final host website/CMS, or exhaustive semantic matching for all possible questions/languages.

## After deployment

Keep the existing Vercel Gemini variables. Test a range question, charging, colours, starting instructions, tyre pressure, app login, EMI, a conflicting specification and an unrelated question. Confirm a supported question works after a fallback. Test mobile input and all three guided enquiry paths on a real phone. Review the prepared WhatsApp message before sending.

Optional: `npm run test:live -- https://YOUR-CHATBOT.vercel.app` sends ten synthetic questions and uses provider quota. Do not run it repeatedly against a free-tier project. An unavailable or insufficient-quota provider is not a successful live verification.
