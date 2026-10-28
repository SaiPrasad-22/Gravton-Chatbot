import { describe, it, expect, vi, afterEach } from 'vitest';
import { records } from '../server/knowledge/records';
import sources from '../server/knowledge/sources.json' with { type: 'json' };
import { approvedAnswer, approvedSelection, matchingRecords, sourceRequested, sourceNoteFor, GENERIC_SOURCE_NOTE } from '../server/knowledge';
import { PUBLIC_SOURCE_LABELS } from '../server/knowledge/public-sources';
import { generateGemini } from '../server/providers/gemini';
import { SALES_FALLBACK } from '../shared/messages';
import before from './fixtures/facts-before-wording-pass.json' with { type: 'json' };

const INTERNAL = /Sources?:|\.pdf|\.docx|Product-Booklet|Bifold|Start-up-Guide|User-Manual|Gravton Info|\bpage \d|\b(booklet|brochure|startup|manual|info)-p\d+/i;
const DOCUMENT_SPEAK = /supplied (specifications|documents|website|Quanta|Gravton|company)|User Manual|Start-up Guide|Product Booklet|brochures?\b|website copy|\bFAQs?\b|\bthe (Quanta S\+ )?manual (says|lists|states|identifies|specifies|describes|directs|warns)|\bdocuments (list|describe)|\bmaterials describe/i;
const tokens = (s: string) => [...s.matchAll(/\d[\d.,/]*\d|\d|[A-Z]{2,}[0-9A-Z]*|₹|%/g)].map(m => m[0]).sort();

describe('customer-facing answers', () => {
  it('no stored answer mentions a document, file, page or internal label', () => {
    for (const r of records) { expect(r.answer, r.id).not.toMatch(DOCUMENT_SPEAK); expect(r.answer, r.id).not.toMatch(INTERNAL); }
  });
  it('every answer still carries the same numbers, units and codes as before the wording pass', () => {
    // Wording-only guard. If a fact is changed on purpose, update tests/fixtures/facts-before-wording-pass.json from the new answers.
    const known = before as Record<string, string[]>;
    expect(Object.keys(known).sort()).toEqual(records.map(r => r.id).sort());
    for (const r of records) {
      const now = new Set(tokens(r.answer)); const was = new Set(known[r.id]);
      expect([...was].filter(x => !now.has(x)), `${r.id}: facts dropped`).toEqual([]);
      expect([...now].filter(x => !was.has(x)), `${r.id}: facts added`).toEqual([]);
    }
  });
  it('approved answers never contain source labels, for any single record or any pair', () => {
    for (const r of records) {
      const out = approvedAnswer(JSON.stringify({ supported: true, ids: [r.id] }), records);
      expect(out, r.id).toBe(r.answer);
      expect(out).not.toMatch(INTERNAL);
    }
    const two = approvedAnswer(JSON.stringify({ supported: true, ids: ['range', 'charge-time'] }), records);
    expect(two).not.toMatch(INTERNAL);
  });
  it('keeps the internal citation capability: every selection resolves to real source text', () => {
    const byId = new Map(sources.map(s => [s.id, s]));
    for (const r of records) {
      const sel = approvedSelection(JSON.stringify({ supported: true, ids: [r.id] }), records);
      expect(sel, r.id).toBeDefined();
      expect(sel!.citations.length, r.id).toBeGreaterThan(0);
      for (const id of r.sources) expect(byId.get(id)?.text, `${r.id} -> ${id}`).toBeTruthy();
    }
  });
  it('still falls back for malformed, unsupported or unknown selections', () => {
    for (const raw of ['not json', '{"supported":false,"ids":[]}', '{"supported":true,"ids":["nope"]}', '{"supported":true,"ids":["range","range"]}']) expect(approvedAnswer(raw, records)).toBe(SALES_FALLBACK);
  });
});

describe('explicit requests for a source', () => {
  it('recognises genuine requests and ignores ordinary questions', () => {
    for (const q of ['What is the source of this?', 'Which document says that?', 'Where did you get that information?', 'Can you give me a reference?', 'Is there proof of the range?']) expect(sourceRequested(q), q).toBe(true);
    for (const q of ['What is the range?', 'How do I charge it?', 'EMI options', 'Is the battery safe?']) expect(sourceRequested(q), q).toBe(false);
  });
  it('names public document titles only, never file names or pages', () => {
    const out = approvedAnswer(JSON.stringify({ supported: true, ids: ['range'] }), records, { publicSources: true });
    expect(out).toContain(records.find(r => r.id === 'range')!.answer);
    expect(out).toMatch(/This information comes from the Gravton Quanta/);
    expect(out).not.toMatch(INTERNAL);
    for (const label of Object.values(PUBLIC_SOURCE_LABELS)) expect(label).not.toMatch(INTERNAL);
  });
  it('answers "where did you get that?" from the previous answer without calling Gemini', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f); process.env.GEMINI_API_KEY = 'test-placeholder-key';
    const prev = records.find(r => r.id === 'warranty')!.answer;
    const reply = await generateGemini([{ role: 'user', content: 'What is the warranty?' }, { role: 'assistant', content: prev }, { role: 'user', content: 'Where did you get that?' }]);
    expect(f).not.toHaveBeenCalled();
    expect(reply).toMatch(/This information comes from/); expect(reply).not.toMatch(INTERNAL);
    const none = await generateGemini([{ role: 'user', content: 'Which document is this from?' }]);
    expect(none).toBe(GENERIC_SOURCE_NOTE); expect(f).not.toHaveBeenCalled();
    expect(sourceNoteFor([{ role: 'user', content: 'hi' }, { role: 'assistant', content: SALES_FALLBACK }, { role: 'user', content: 'source?' }])).toBe(GENERIC_SOURCE_NOTE);
  });
  afterEach(() => { vi.unstubAllGlobals(); });
});

describe('request sent to Gemini', () => {
  it('sends only the last two exchanges and no internal source ids', async () => {
    process.env.GEMINI_API_KEY = 'test-placeholder-key'; let body: any;
    vi.stubGlobal('fetch', async (_u: unknown, init: RequestInit) => { body = JSON.parse(String(init.body)); return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: JSON.stringify({ supported: true, ids: ['range'] }) }] } }] }), { headers: { 'Content-Type': 'application/json' } }); });
    const long = [] as { role: 'user' | 'assistant'; content: string }[];
    for (let i = 0; i < 4; i++) { long.push({ role: 'user', content: 'Question ' + i }, { role: 'assistant', content: 'Answer ' + i }); }
    long.push({ role: 'user', content: 'What is the range?' });
    const reply = await generateGemini(long);
    expect(reply).toBe(records.find(r => r.id === 'range')!.answer);
    expect(body.contents).toHaveLength(5);
    expect(body.contents.at(-1).parts[0].text).toBe('What is the range?');
    const system = JSON.stringify(body.systemInstruction);
    expect(system).toContain('CANDIDATE RECORDS'); expect(system).not.toMatch(/booklet-p\d|manual-p\d|brochure-p\d/);
    expect(matchingRecords('What is the range?').length).toBeGreaterThan(0);
  });
});
