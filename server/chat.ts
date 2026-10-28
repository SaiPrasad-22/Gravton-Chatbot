import { SALES_FALLBACK } from '../shared/messages.js';
import { configuredKey, generateGemini, providerFailure } from './providers/gemini.js';
import { z } from 'zod';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { allowRequest } from './limiter.js';
import { enrichReply } from './enrich.js';
const schema = z.object({ messages: z.array(z.object({
  role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(3500)
}).strict()).min(1).max(11) }).strict().refine(({ messages }) =>
  messages[0].role === 'user' && messages.at(-1)?.role === 'user' &&
  messages.every((m, i) => m.role === (i % 2 === 0 ? 'user' : 'assistant')) &&
  messages.filter(m => m.role === 'user').every(m => m.content.length <= 1200) &&
  messages.reduce((sum, m) => sum + m.content.length, 0) <= 9000);
const replySchema = z.string().trim().min(1).max(3500);
type Request = IncomingMessage & { body?: unknown };
export type Generate = (messages: z.infer<typeof schema>['messages']) => Promise<string>;
function send(res: ServerResponse, status: number, body: object) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}
export function createHandler(makeReply: Generate = generateGemini) {
  return async function chat(req: Request, res: ServerResponse) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Use POST for chat.' }); }
    const origin = req.headers.origin;
    if (origin) {
      try { if (new URL(origin).host !== req.headers.host) return send(res, 403, { error: 'Request origin is not allowed.' }); }
      catch { return send(res, 403, { error: 'Invalid request origin.' }); }
    }
    if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return send(res, 415, { error: 'Send a JSON request.' });
    if (Number(req.headers['content-length'] || 0) > 32_768) return send(res, 413, { error: 'Request is too large.' });
    // On Vercel, trust the platform-overwritten x-vercel-forwarded-for only.
    const forwarded = process.env.VERCEL === '1' ? req.headers['x-vercel-forwarded-for'] : undefined;
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || 'unknown';
    if (!allowRequest(ip)) { res.setHeader('Retry-After', '60'); return send(res, 429, { error: 'Too many questions. Please wait a minute and retry.' }); }
    let raw: unknown;
    try {
      if (req.body !== undefined) {
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        if (Buffer.byteLength(body) > 32_768) return send(res, 413, { error: 'Request is too large.' });
        raw = JSON.parse(body);
      } else {
        const chunks: Buffer[] = []; let size = 0;
        for await (const chunk of req) {
          const buffer = Buffer.from(chunk); size += buffer.length;
          if (size > 32_768) { send(res, 413, { error: 'Request is too large.' }); return; }
          chunks.push(buffer);
        }
        raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      }
    } catch { return send(res, 400, { error: 'Invalid JSON request.' }); }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return send(res, 400, { error: 'Invalid conversation. Please shorten your message or start a new chat.' });
    if (!configuredKey()) return send(res, 503, { code: 'AI_NOT_CONFIGURED', error: SALES_FALLBACK });
    try {
      const answer = replySchema.safeParse(await makeReply(parsed.data.messages));
      if (!answer.success) throw new Error('Invalid answer');
      return send(res, 200, enrichReply(answer.data, parsed.data.messages));
    } catch (error) {
      const failure = providerFailure(error);
      if (failure.retryAfter) res.setHeader('Retry-After', failure.retryAfter);
      return send(res, failure.status, { code: failure.code, error: SALES_FALLBACK });
    }
  };
}
