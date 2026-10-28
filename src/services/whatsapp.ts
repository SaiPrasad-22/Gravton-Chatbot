import { WHATSAPP_NUMBER } from '../config';

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Opens WhatsApp in a new tab. Must be called from a user gesture (a click).
 * Returns false when the browser blocked the new window. A `true` result only means a window
 * opened — it does NOT mean a message was sent or received.
 */
export function openWhatsApp(message: string): boolean {
  const opened = window.open(buildWhatsAppUrl(message), '_blank');
  if (!opened) return false;
  opened.opener = null;
  return true;
}

/** Copies text to the clipboard; resolves false if every method fails. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export const DIRECT_CHAT_MESSAGE =
  'Hello Gravton,\n\nI would like to know more about Gravton Quanta.\nPlease share more details about the Quanta S+ and help me with the next steps.';

export const QUANTA_ENQUIRY_MESSAGE =
  'Hello Gravton,\n\nI would like to know more about the Quanta S+.\n\nPlease share more details, pricing and availability.';

export const TOPIC_MESSAGES = {
  battery: 'Hello Gravton,\n\nI would like to know more about the Quanta S+ battery and charging.',
  performance: 'Hello Gravton,\n\nI would like to know more about the Quanta S+ performance and specifications.',
  safety: 'Hello Gravton,\n\nI would like to know more about the Quanta S+ safety, build quality and features.',
} as const;

/** Sales handoff from the AI chat: includes the visitor's latest question when there is one. */
export function buildChatHandoffMessage(lastQuestion?: string): string {
  const question = lastQuestion?.trim();
  if (!question) return QUANTA_ENQUIRY_MESSAGE;
  return `Hello Gravton,\n\nI have a question about Gravton Quanta:\n"${question}"\n\nPlease help me with more details.`;
}

/** Sales handoff for a question the assistant could not answer. The visitor sends it themselves; nothing is sent automatically. */
export function buildUnansweredMessage(lastQuestion?: string): string {
  const question = lastQuestion?.trim();
  if (!question) return QUANTA_ENQUIRY_MESSAGE;
  return `Hello Gravton,\n\nI asked your assistant a question it could not answer:\n"${question}"\n\nPlease help me with it.`;
}
