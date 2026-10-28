import { describe, it, expect } from 'vitest';
import { records } from '../server/knowledge/records';
import { matchingRecords } from '../server/knowledge';
import { groups, followUpsFor } from '../server/config/follow-ups';
import { enrichReply } from '../server/enrich';
import { STARTER_SUGGESTIONS, CHAT_ACTIONS } from '../shared/chat-contract';
import { SALES_FALLBACK } from '../shared/messages';

const ids = new Set(records.map((r) => r.id));
const answer = (id: string) => records.find((r) => r.id === id)!.answer;

describe('follow-up questions and next actions', () => {
  it('every suggestion can be answered from the knowledge base (none leads to a dead end)', () => {
    const all = new Set([...STARTER_SUGGESTIONS, ...groups.flatMap((g) => g.suggestions)]);
    for (const s of all) { if (/^(EMI|Book a test ride)/i.test(s)) continue; expect(matchingRecords(s).length, s).toBeGreaterThan(0); }
  });
  it('every record id named in a group exists', () => {
    for (const g of groups) for (const id of g.ids) if (typeof id === 'string') expect(ids.has(id), id).toBe(true);
  });
  it('only uses actions the interface understands', () => {
    for (const g of groups) if (g.action) expect(CHAT_ACTIONS).toContain(g.action);
  });
  it('offers the right guided flow after the matching answer', () => {
    expect(enrichReply(answer('test-ride'), [{ role: 'user', content: 'Can I test ride?' }]).action).toBe('test_ride');
    expect(enrichReply(answer('dealer'), [{ role: 'user', content: 'dealership' }]).action).toBe('dealer');
    expect(enrichReply(answer('office'), [{ role: 'user', content: 'where is your office' }]).action).toBe('showroom');
    expect(enrichReply(answer('range'), [{ role: 'user', content: 'range' }]).action).toBe('none');
  });
  it('turns the standard "ask the sales team" reply into a hand-off, and nothing else', () => {
    const h = enrichReply(SALES_FALLBACK, [{ role: 'user', content: 'Do you sell helmets?' }]);
    expect(h).toMatchObject({ handoff: true, action: 'whatsapp' });
    expect(enrichReply(answer('range'), [{ role: 'user', content: 'range' }]).handoff).toBe(false);
  });
  it('gives at most three suggestions and never repeats the question just asked', () => {
    const r = enrichReply(answer('range'), [{ role: 'user', content: 'How long does charging take?' }]);
    expect(r.suggestions.length).toBeLessThanOrEqual(3);
    expect(r.suggestions.map((s) => s.toLowerCase())).not.toContain('how long does charging take?');
    expect(enrichReply(answer('charge-time'), [{ role: 'user', content: 'x' }]).suggestions.length).toBeGreaterThan(0);
  });
  it('falls back to the starter questions for an answer built from no known record', () => {
    expect(followUpsFor([]).suggestions).toEqual(STARTER_SUGGESTIONS);
    expect(enrichReply('A model answer', [{ role: 'user', content: 'hi' }]).suggestions.length).toBeGreaterThan(0);
  });
});
