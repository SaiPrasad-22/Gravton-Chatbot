import { SALES_FALLBACK, BUSY_MESSAGE } from '../../shared/messages';
import { STARTER_SUGGESTIONS, isChatAction, type ChatReply } from '../../shared/chat-contract';
export type Message = { role: 'user' | 'assistant'; content: string };
export function recentHistory(messages: Message[]) {
  // Retain complete user/assistant pairs, ending with the new user message.
  let recent = messages.slice(-11);
  while (recent.length > 1 && (recent[0].role !== 'user' || recent.reduce((n, m) => n + m.content.length, 0) > 9000)) recent = recent.slice(2);
  return recent;
}
export async function ask(messages: Message[], signal: AbortSignal): Promise<ChatReply> {
  const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: recentHistory(messages) }), signal });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    // 429 means too many questions (or the provider's free-tier limit): say so plainly instead of implying the answer is unknown.
    throw new Error(response.status === 429 ? BUSY_MESSAGE : SALES_FALLBACK);
  }
  const d = data as Record<string, unknown> | null;
  if (!d || typeof d.reply !== 'string' || !d.reply.trim() || d.reply.length > 3500) throw new Error('We could not read the answer. Please retry.');
  const suggestions = Array.isArray(d.suggestions) ? d.suggestions.filter((s): s is string => typeof s === 'string' && s.length > 0 && s.length <= 80).slice(0, 4) : [];
  return { reply: d.reply, suggestions: suggestions.length ? suggestions : STARTER_SUGGESTIONS, action: isChatAction(d.action) ? d.action : 'none', handoff: d.handoff === true };
}
