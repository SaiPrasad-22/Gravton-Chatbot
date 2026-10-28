import { GoogleGenAI, ApiError, FinishReason } from '@google/genai';
import { instructions, matchingRecords, retrievalQuery, forcedAnswer, approvedAnswer, sourceRequested, sourceNoteFor, SALES_FALLBACK } from '../knowledge.js';
export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export function configuredKey() {
 const key = process.env.GEMINI_API_KEY?.trim();
 return key && !/^(PASTE_|YOUR_|REPLACE_)/i.test(key) ? key : undefined;
}
export class GeminiResponseError extends Error {
 constructor(public readonly code: 'AI_RESPONSE_BLOCKED' | 'AI_INCOMPLETE_RESPONSE') { super(code); }
}
export async function generateGemini(messages: ChatMessage[]): Promise<string> {
 const latest = messages.at(-1)?.content || '';
 const askedForSource = sourceRequested(latest);
 // "Where did you get that?" about the previous answer needs no new model request.
 if (askedForSource && !matchingRecords(latest).length) return sourceNoteFor(messages);
 const query = retrievalQuery(messages);
 const forced = forcedAnswer(query); if (forced) return forced;
 const candidates = matchingRecords(query);
 if (!candidates.length) return SALES_FALLBACK;
 const client = new GoogleGenAI({ apiKey: configuredKey(), vertexai: false,
  httpOptions: { timeout: 25_000, retryOptions: { attempts: 1 } } });
 const abort = new AbortController();
 const timer = setTimeout(() => abort.abort(), 25_000);
 try {
  const response = await client.models.generateContent({
   model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
   contents: messages.slice(-5).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
   config: { systemInstruction: instructions + '\nCANDIDATE RECORDS:\n' + JSON.stringify(candidates.map(({ id, topics, answer }) => ({ id, topics, answer }))), maxOutputTokens: 1800, abortSignal: abort.signal, responseMimeType: 'application/json', responseJsonSchema: { type: 'object', properties: { supported: { type: 'boolean' }, ids: { type: 'array', items: { type: 'string', enum: candidates.map(r=>r.id) }, maxItems: 3 } }, required: ['supported','ids'], additionalProperties: false } },
  });
  if (response.promptFeedback?.blockReason) throw new GeminiResponseError('AI_RESPONSE_BLOCKED');
  const reason = response.candidates?.[0]?.finishReason;
  if (reason && reason !== FinishReason.STOP) {
   throw new GeminiResponseError(reason === FinishReason.MAX_TOKENS ? 'AI_INCOMPLETE_RESPONSE' : 'AI_RESPONSE_BLOCKED');
  }
  const text = response.text?.trim();
  if (!text) throw new GeminiResponseError('AI_INCOMPLETE_RESPONSE');
  return approvedAnswer(text, candidates, { publicSources: askedForSource });
 } catch (error) {
  if (abort.signal.aborted) throw new DOMException('Request timed out', 'TimeoutError');
  throw error;
 } finally { clearTimeout(timer); }
}
export function providerFailure(error: unknown): { status: number; code: string; message: string; retryAfter?: string } {
 if (error instanceof GeminiResponseError) return { status: 502, code: error.code, message: 'We could not provide that answer. Please rephrase your question or contact Gravton on WhatsApp.' };
 if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) return { status: 504, code: 'AI_TIMEOUT', message: 'The answer took too long. Please retry or use WhatsApp.' };
 if (error instanceof ApiError) {
  // Inspect provider metadata internally; never return/log raw provider text or credentials.
  let reason = ''; let providerStatus = '';
  try {
   const parsed: unknown = JSON.parse(error.message);
   if (parsed && typeof parsed === 'object' && 'error' in parsed) {
    const detail = parsed.error as { status?: unknown; details?: { reason?: unknown }[] };
    providerStatus = typeof detail.status === 'string' ? detail.status : '';
    reason = Array.isArray(detail.details) ? detail.details.map(d => typeof d.reason === 'string' ? d.reason : '').join(',') : '';
   }
  } catch { /* Unknown provider format remains a sanitized upstream error. */ }
  if (error.status === 401 || reason.includes('API_KEY_INVALID') || reason.includes('API_KEY_EXPIRED')) return { status: 503, code: 'AI_CREDENTIAL_INVALID', message: 'AI chat is unavailable. Please contact Gravton on WhatsApp.' };
  if (error.status === 403 || error.status === 404) return { status: 503, code: 'AI_ACCESS_UNAVAILABLE', message: 'AI chat is unavailable. Please contact Gravton on WhatsApp.' };
  if (providerStatus === 'FAILED_PRECONDITION') return { status: 503, code: 'AI_CONFIGURATION_ERROR', message: 'AI chat is unavailable. Please contact Gravton on WhatsApp.' };
  if (error.status === 429) return { status: 429, code: 'AI_QUOTA_LIMIT', message: 'AI request capacity has been reached. Please try again later or contact Gravton on WhatsApp.' };
  if (error.status === 504 || error.status === 408) return { status: 504, code: 'AI_TIMEOUT', message: 'The answer took too long. Please retry or use WhatsApp.' };
 }
 return { status: 502, code: 'AI_UPSTREAM_ERROR', message: 'We could not get an answer. Please retry or contact Gravton on WhatsApp.' };
}
