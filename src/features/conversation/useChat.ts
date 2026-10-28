import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT_LIMITS, STARTER_SUGGESTIONS, type ChatAction } from '../../shared/chatContract';
import { GREETING } from '../../config/chat-copy';
import { ask, type Message } from '../../services/chat';

export interface ChatMessage { id: number; role: 'user' | 'assistant'; content: string; local?: boolean }
export type ChatStatus = 'idle' | 'loading' | 'error';
export interface ChatState {
  messages: ChatMessage[];
  nextId: number;
  status: ChatStatus;
  error: string | null;
  suggestions: string[];
  action: ChatAction;
  /** The assistant could not answer: the interface offers the sales team on WhatsApp for `lastQuestion`. */
  handoff: boolean;
  lastQuestion: string;
}

export { GREETING, STARTER_SUGGESTIONS };

export interface ChatController {
  state: ChatState;
  send(text: string): boolean;
  retry(): void;
  reset(): void;
}

function initialState(): ChatState {
  return { messages: [{ id: 0, role: 'assistant', content: GREETING, local: true }], nextId: 1, status: 'idle', error: null, suggestions: STARTER_SUGGESTIONS, action: 'none', handoff: false, lastQuestion: '' };
}

const TIMEOUT_MS = 28_000;

/** What the server sees: the real conversation only (never the local greeting), user and assistant turns alternating, ending on the visitor. */
function toApi(messages: ChatMessage[]): Message[] {
  return messages.filter((m) => !m.local).map(({ role, content }) => ({ role, content }));
}

export function useChat(): ChatController {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const commit = useCallback((next: ChatState) => { stateRef.current = next; setState(next); }, []);

  const run = useCallback(async (base: ChatState) => {
    const mine = ++generation.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const reply = await ask(toApi(base.messages), controller.signal);
      if (mine !== generation.current) return;
      commit({ ...base, messages: [...base.messages, { id: base.nextId, role: 'assistant', content: reply.reply }], nextId: base.nextId + 1, status: 'idle', error: null, suggestions: reply.suggestions, action: reply.action, handoff: reply.handoff });
    } catch (error) {
      if (mine !== generation.current) return;
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      commit({ ...base, status: 'error', error: aborted ? 'This is taking longer than expected. Please try again.' : error instanceof Error ? error.message : 'Something went wrong. Please try again.' });
    } finally {
      window.clearTimeout(timer);
      if (mine === generation.current) busyRef.current = false;
    }
  }, [commit]);

  const send = useCallback((text: string) => {
    const content = text.trim().slice(0, CHAT_LIMITS.maxUserChars);
    if (!content || busyRef.current) return false;
    busyRef.current = true;
    const cur = stateRef.current;
    const next: ChatState = { ...cur, messages: [...cur.messages, { id: cur.nextId, role: 'user', content }], nextId: cur.nextId + 1, status: 'loading', error: null, suggestions: [], action: 'none', handoff: false, lastQuestion: content };
    commit(next);
    void run(next);
    return true;
  }, [commit, run]);

  // Retry asks the same question again: the visitor's message is already in the conversation, so it is not duplicated.
  const retry = useCallback(() => {
    const cur = stateRef.current;
    if (busyRef.current || cur.status !== 'error' || cur.messages.at(-1)?.role !== 'user') return;
    busyRef.current = true;
    const next: ChatState = { ...cur, status: 'loading', error: null };
    commit(next);
    void run(next);
  }, [commit, run]);

  const reset = useCallback(() => {
    generation.current += 1;
    abortRef.current?.abort();
    busyRef.current = false;
    commit(initialState());
  }, [commit]);

  useEffect(() => () => { generation.current += 1; abortRef.current?.abort(); }, []);

  return { state, send, retry, reset };
}
