import type { VercelRequest, VercelResponse } from '@vercel/node';
import { leadHandler } from '../server/lead.js';
export default function handler(req:VercelRequest,res:VercelResponse){return leadHandler(req,res);}
