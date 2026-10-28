// Follow-up questions and the next action offered after an answer. Chosen from the reviewed records the answer was built from, so no extra
// request to Gemini is made. Edit the groups below to change what is suggested; every suggestion should be answerable from the knowledge base
// (tests/follow-ups.test.ts checks that each one matches at least one record).
import { STARTER_SUGGESTIONS, type ChatAction } from '../../shared/chat-contract.js';

interface Group { ids: (string | RegExp)[]; suggestions: string[]; action?: ChatAction }
export const groups: Group[] = [
  { ids: ['range', 'splus-mode-range', 's-mode-range', 'modes', 'speed', 'torque', 'motor', 'gradient', 'compare', 'chemistry', 's-capacity'], suggestions: ['How long does charging take?', 'What is the warranty?', 'Compare Quanta S and S+'] },
  { ids: ['charge-time', 'charge-steps', 'charger-led', 'charger-care', 'charger-rating'], suggestions: ['What is the range?', 'What is the warranty?', 'How do I start the bike?'] },
  { ids: ['warranty', 'warranty-exclusions', 'warranty-paint'], suggestions: ['What is the range?', 'How long does charging take?', 'Book a test ride'] },
  { ids: ['wheels', 'pressure', 'brakes', 'suspension', 'chassis', 'dimensions', 'kerb', 'seats', 'colours', 'accessories', 'regen'], suggestions: ['What is the range?', 'Compare Quanta S and S+', 'Book a test ride'] },
  { ids: ['first-ride', 'start', 'not-starting', 'mcb', 'side-stand', 'parking', 'storage', 'washing', 'reverse', 'trip', 'indicators', 'lighting'], suggestions: ['How do I use the Gravton app?', 'What is the warranty?', 'How do I contact Gravton support?'] },
  { ids: ['app', 'app-login', 'remote', 'serial'], suggestions: ['How do I start the bike?', 'What is the warranty?', 'How do I contact Gravton support?'] },
  { ids: [/^fault-/, 'fault-icons', 'authorized-service', 'doorstep', 'support'], suggestions: ['How do I contact Gravton support?', 'What is the warranty?', 'How do I start the bike?'] },
  { ids: ['test-ride'], suggestions: ['What is the range?', 'EMI / Finance Options', 'Compare Quanta S and S+'], action: 'test_ride' },
  { ids: ['dealer'], suggestions: ['What is the range?', 'Compare Quanta S and S+'], action: 'dealer' },
  { ids: ['office'], suggestions: ['Book a test ride', 'What is the warranty?'], action: 'showroom' },
  { ids: ['k2k', 'cost', 'particle', 'arq'], suggestions: ['What is the range?', 'Book a test ride', 'EMI / Finance Options'] },
];

export function followUpsFor(recordIds: string[]): { suggestions: string[]; action: ChatAction } {
  for (const id of recordIds) {
    const group = groups.find((g) => g.ids.some((m) => (typeof m === 'string' ? m === id : m.test(id))));
    if (group) return { suggestions: group.suggestions, action: group.action ?? 'none' };
  }
  return { suggestions: STARTER_SUGGESTIONS, action: 'none' };
}
