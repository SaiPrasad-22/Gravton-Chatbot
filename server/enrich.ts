import { records } from './knowledge/records.js';
import { SALES_FALLBACK } from '../shared/messages.js';
import { STARTER_SUGGESTIONS, type ChatReply } from '../shared/chat-contract.js';
import { followUpsFor } from './config/follow-ups.js';

// Adds the interface hints to an approved answer. Nothing here asks Gemini anything: a hand-off is simply the standard "ask the sales team"
// reply, and the follow-ups come from the reviewed records the answer contains.
export function enrichReply(reply: string, messages: { role: string; content: string }[]): ChatReply {
  const handoff = reply === SALES_FALLBACK;
  const used = handoff ? [] : records.filter((r) => reply.includes(r.answer)).map((r) => r.id);
  const { suggestions, action } = handoff ? { suggestions: STARTER_SUGGESTIONS, action: 'whatsapp' as const } : followUpsFor(used);
  const asked = messages.at(-1)?.content.trim().toLowerCase();
  return { reply, suggestions: suggestions.filter((s) => s.toLowerCase() !== asked).slice(0, 3), action, handoff };
}
