import type { IncomingMessage, ServerResponse } from 'node:http';
import { leadSchema } from '../shared/lead.js';
import { allowRequest } from './limiter.js';
// Validation only: no database/CRM is configured. Never pretend this is durable storage.
export async function leadHandler(req: IncomingMessage & { body?: unknown },res: ServerResponse) {
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
 const send=(status:number,body:object)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'Use POST.'});}
 try{if(req.headers.origin && new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Origin not allowed.'});}catch{return send(403,{error:'Origin not allowed.'});}
 if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'Use JSON.'});
 const forwarded=process.env.VERCEL==='1'?req.headers['x-vercel-forwarded-for']:undefined;
 const ip=typeof forwarded==='string'?forwarded.split(',')[0].trim():req.socket.remoteAddress||'unknown';
 if(!allowRequest('lead:'+ip)){res.setHeader('Retry-After','60');return send(429,{error:'Please wait a minute and retry.'});}
 try {
  let body:string;
  if(req.body!==undefined)body=typeof req.body==='string'?req.body:JSON.stringify(req.body);
  else {let size=0;const chunks:Buffer[]=[];for await(const chunk of req){const b=Buffer.from(chunk);size+=b.length;if(size>4096)return send(413,{error:'Request too large.'});chunks.push(b);}body=Buffer.concat(chunks).toString('utf8');}
  if(Buffer.byteLength(body)>4096)return send(413,{error:'Request too large.'});
  if(!leadSchema.safeParse(JSON.parse(body)).success)return send(400,{error:'Please check your details.'});
  // Only an acknowledgement. No personal details are returned or logged.
  return send(200,{accepted:true,persisted:false,notified:false});
 }catch{return send(400,{error:'Invalid request.'});}
}
