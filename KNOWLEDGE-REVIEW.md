# Knowledge review — 25 October 2026

## Files inspected and imported

| Original uploaded file | Indexed source sections | Reviewed coverage examples |
| --- | ---: | --- |
| Product-Booklet.pdf | 17 pages | Quanta comparison, colours, K2K, motor/platform features, Particle and ARQ (kept model-specific) |
| Bifold-Brohure.pdf | 4 pages | Range, charging, riding modes, motor, brakes, dimensions and warranty |
| Start-up-Guide-Quanta.pdf | 24 pages | Starting sequence, switches, charging precautions, maintenance cautions, app access and contact information |
| User-Manual-Quanta-S+.pdf | 33 pages | S+ operating instructions, tyre pressure, brake sizes, warranty limits, warning/fault codes and service cautions |
| Gravton Info.docx | 1 document section | Quanta comparison and FAQs, service availability, support and sales context |

The brief names `Product-Booklet(1).pdf`; the actual attached file is `Product-Booklet.pdf`. That attached version was reviewed. PDF page numbers here mean one-based PDF pages, not printed numbering. All PDF text and DOCX paragraphs/tables were inspected; image-heavy specifications/labels were visually checked where needed. Source sections retain extraction artifacts; reviewed answers are paraphrased, not unchecked OCR text.

Original files were not changed. `server/knowledge/manifest.json` preserves their SHA-256 hashes. `sources.json` holds 79 indexed sections and `records.ts` has 79 reviewed answer units. Each unit names its supporting section IDs. `npm run knowledge:check` verifies source references, unique IDs and representation of every document. Raw source text is server-side, not a public downloadable copy of the PDFs.

## Architecture found and used

The existing delivered source used the Gemini SDK with a small hardcoded fact list. It contained no File Search store ID, upload status, embeddings or retrieval integration. A screenshot describing Google File Search did not establish that a store existed. We did not upload these documents to Google or claim an external store was indexed.

This release imports the reviewed content locally in the server bundle. Topic matching retrieves candidate answer units, Gemini selects supported IDs, and the backend returns only approved text and source labels. A source reference is checked against the imported section map before an answer is returned. Document facts never come from arbitrary generated prose. Service failures and unsupported or invalid selections return the configured fallback.

The finite reviewed record set is intentionally conservative. Importing all pages does not mean every possible question about every sentence is supported. Topic matching can miss paraphrases, and Gemini can still choose an irrelevant approved unit. Automated tests cover representative retrieval and forged/invalid responses, not universal semantic correctness. The live provider must still be tested after deployment. No unrestricted model fallback exists.

## Conflicts withheld for business confirmation

| Detail | Conflicting evidence | Current behavior |
| --- | --- | --- |
| Quanta S+ battery capacity | 3.8 kWh in booklet/brochure/Info; 3.84 kWh in S+ manual pp12,17 | Do not assert an exact S+ capacity; static battery card also omits it |
| Seat height | 800 mm in brochure/booklet/Info; 785 mm in S+ manual p12 | Sales fallback |
| Gross vehicle weight and payload | S gross weight 267 kg in booklet p9/brochure versus 263 kg in Info; generic gross figures 263/264 kg; manual p5 payload 150 kg versus Info marketing load 250 kg | Withhold gross/payload/load limits; documented kerb weights remain separate |
| Service schedule | Second service 60 days in startup p23 versus 3.5 months in startup p21/manual p26 | Withhold exact service intervals; refer to authorised service/sales |
| Storage charge and maintenance frequency | Manual p17 50%, p25 85–90%; startup p10 80%, p19 85/100%; recharge timing varies 10/14/15 days | Withhold exact storage SOC and periodic-charge thresholds |
| Battery heat/storage threshold | 30°C in manual p17 versus 50°C warning in p28 | Withhold a single temperature threshold |
| GOTAC expansion | Over The Air Communication in manual p19/Info versus Onboard Telemetry & AI Control in booklet p11 | Features may be described; expansion/full form is withheld |
| Display size/type | 3.25-inch LCD manual p13 versus 3.7-inch startup p6; LED terminology in Info | Withhold size/type |
| Quanta S partial charging time | Info FAQ says 20–30% in 3 hours while specification tables say 20–90% in 3 hours | Withhold partial-charge claim for S; full charge 5.4 hours remains |

Ranges of 165 km (S+) and 125 km (S) are consistently stated in the supplied product comparisons. These are claimed ranges, not a promise of range in every riding condition. Particle/ARQ values are not applied to Quanta. K2K's 4,011.9 km journey is not described as a single-charge range.

Finance partners and “no cost” language appear in Info, but current terms were not separately confirmed and the implementation brief prohibits inventing finance terms. Only the specifically supplied **starting EMI ₹3,000/month**, qualified by eligibility and applicable plan, is used. Exact calculations, interest, tenure, down payment and current partner/approval questions go to sales. This is a deliberate current-offer restriction, not a claim those words are absent from the document.

## Maintaining the knowledge

1. Obtain an authorised updated source or explicit business confirmation for changed facts.
2. Update the matching source entry and manifest hash if the source file changes. Preserve filenames/page labels accurately.
3. Edit reviewed answers/topics and any affected static product cards. Remove a conflict rule only after the conflict is resolved.
4. Add a representative retrieval/validation case for a new or changed topic.
5. Run `npm run knowledge:check`, `npm test`, and `npm run build`, then deploy the complete source.

Do not paste instructions from source documents into privileged system behavior. No source update should add a customer credential or contact database to this index.
