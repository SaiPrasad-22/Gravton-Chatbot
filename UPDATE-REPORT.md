# Gravton update report — version 3.0

## 1. Files changed

- Lead capture: new `shared/lead.ts`, `server/lead.ts`, `api/lead.ts`, and `src/features/leads/{MobileInput,LeadForms,useLead}.tsx/ts`.
- Shared UI state and guided enquiries: `src/components/chat/ChatWidget.tsx`, `src/features/enquiries/{Enquiry.tsx,fields.ts}`.
- Chat experience: `src/features/conversation/{Conversation.tsx,useConversation.ts}`, `src/services/chat.ts`, `src/enhancements.css`.
- Grounding and EMI: `server/knowledge.ts`, new `server/knowledge/{manifest.json,sources.json,records.ts}`, `shared/messages.ts`, `server/providers/gemini.ts`, `server/chat.ts`.
- Static source consistency: `src/components/chat/ReferenceScreens.tsx`.
- Build/dev and packaging: `vite.config.ts`, `tsconfig.json`, `package.json`, lockfile version, `scripts/check-knowledge.ts`, `scripts/package.mjs`.
- Verification: updated flow/SDK/live tests and new knowledge/lead API/lead UI tests.
- Documentation: START-HERE, README, KNOWLEDGE-REVIEW, TEST-RESULTS, WEBSITE-INTEGRATION and this report.

## 2. Mobile-first flow

Ask Gravton AI shows only a 10-digit phone input and Start Chat initially. Both client and server validate the completed number. Pasting spaces/+91 is normalised, overlong input is rejected, and editing/cursor/selection keys work normally. A successful server acknowledgement unlocks questions; the UI then shows only the final four digits. Repeated clicks cannot create concurrent requests.

## 3. Optional name and city

The compact optional form appears after two useful answers or an EMI/purchase/sales enquiry response. Skip continues chatting without repeated prompts. Edit details permits correction. Shared details are reused in test ride, dealership and showroom forms; Back/Main menu preserve answers and progress.

## 4. Storage and updating

The original project had no CRM, database or lead API. The new `/api/lead` validates a structured object, explicitly acknowledges **not persisted/not notified**, and the browser retains one updated object during the current page session. Original source, conversation ID and creation time remain stable; later values update the same object. No marketing consent is inferred. Refreshing clears these details. Durable storage and automatic follow-up are not implemented; future integration requires an actual configured backend and idempotent upsert.

## 5. EMI

An EMI / Finance Options quick reply and finance-intent matching use the supplied starting offer of ₹3,000/month, qualified by eligibility and the applicable plan. Exact calculations and unconfirmed terms go to sales. No calculator, invented rate or approval guarantee is added. WhatsApp remains 917995252220 and messages are prepared for visitor review, not sent automatically.

## 6. Five documents

All five attached documents were read and imported into 79 source sections and 79 reviewed answer records, with filename/page references and original hashes. All five contribute tested retrieval examples. See KNOWLEDGE-REVIEW.md for source coverage and conflicts.

The original delivered code had no Google File Search/RAG store configuration. The technical change therefore replaces the small fact list with bundled server retrieval and constrained answer selection. It does not claim that Google File Search uploads, indexing or a store ID were verified. No extra upload step is needed for this package's local index.

## 7. Fallback enforcement

Known conflicts and unsupported/current-price questions are rejected server-side. For other questions, candidate retrieval precedes Gemini; no candidates means fallback. Gemini can select only reviewed IDs, and the server validates selection shape, IDs and source presence before returning stored prose. It rejects arbitrary generated prose. Service errors use the same friendly sales fallback. EMI-specific fallback follows the brief's exact finance response. Relevance still depends partly on selection and finite topic coverage; no guarantee of universal semantic correctness is made.

## 8. UI changes

Existing logo, dark header, green accents, launcher and overall sizing remain. Continue and Start Chat use dark primary styling; Back/Main menu and Skip are compact secondary controls. The transcript uses the existing single scroll region. Quick replies wrap, optional details remain compact, and the green sales button remains clear. Ambiguous S+ battery capacity was removed from the static card pending confirmation.

## 9. Results

63 automated tests passed. Five-file source validation, TypeScript/Vite build, API bundling and production dependency audit passed. Desktop and narrow-screen browser checks covered the gate, shared phone reuse, button hierarchy and missing-provider fallback. TEST-RESULTS.md gives exact coverage and unverified items. No real Gemini call or Vercel redeployment was completed here.

## 10. Deployment/configuration remaining

Extract the ZIP and deploy the full updated source to the existing Vercel project. Keep `GEMINI_API_KEY` and `GEMINI_MODEL` unchanged; the existing default remains `gemini-3.5-flash-lite`. No new variables or migrations are required. Preserve the Vite build (`npm run build`, output `dist`) and Node.js 22 or newer. Both `api/chat.ts` and `api/lead.ts`, plus `server` and `shared`, must be included. Test real Gemini answers and a physical mobile device after deployment. The live URL is unchanged until you deploy this source.
