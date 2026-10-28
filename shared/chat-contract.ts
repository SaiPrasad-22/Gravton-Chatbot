// The contract between the chat interface and /api/chat. Defined once here and imported by both sides.
export const CHAT_LIMITS = { maxUserChars: 500 } as const;
export const CHAT_ACTIONS = ['none', 'whatsapp', 'test_ride', 'dealer', 'showroom'] as const;
export type ChatAction = (typeof CHAT_ACTIONS)[number];
export const isChatAction = (value: unknown): value is ChatAction => typeof value === 'string' && (CHAT_ACTIONS as readonly string[]).includes(value);

/** The suggestions shown at the start of a chat and after an answer that has no more specific follow-ups. */
export const STARTER_SUGGESTIONS = ['What is the range?', 'How long does charging take?', 'EMI / Finance Options', 'Book a test ride'];

/** What /api/chat returns for an answered question. `reply` is the customer-facing text; the rest drives the interface. */
export interface ChatReply {
  reply: string;
  /** Up to three relevant follow-up questions. */
  suggestions: string[];
  /** A guided flow worth offering next (test ride, dealer, showroom), or 'whatsapp' when the sales team should take over. */
  action: ChatAction;
  /** True when the assistant could not answer from its knowledge and the sales team should help. */
  handoff: boolean;
}
