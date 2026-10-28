import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../server/chat.js';
export const config = { maxDuration: 30 };
const chat = createHandler();
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return chat(req, res);
}
