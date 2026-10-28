import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHandler, type Generate } from '../server/chat';
import { allowRequest } from '../server/limiter';
import { instructions } from '../server/knowledge';
import { ApiError } from '@google/genai';
let servers: Server[] = [];
const originalKey = process.env.GEMINI_API_KEY;
afterEach(async () => { if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY=originalKey; await Promise.all(servers.map(s => new Promise<void>(r => s.close(() => r())))); servers=[]; });
async function endpoint(generate: Generate = async () => 'Supplied claimed range: up to 165 km.') {
 const server=createServer(createHandler(generate)); servers.push(server); await new Promise<void>(r => server.listen(0,'127.0.0.1',r)); return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
const body = JSON.stringify({messages:[{role:'user',content:'What is the range?'}]});
const options={method:'POST',headers:{'Content-Type':'application/json'},body};
describe('chat HTTP contract',()=>{
 it('returns safe missing-key error', async()=>{ delete process.env.GEMINI_API_KEY; const r=await fetch(await endpoint(),options);expect(r.status).toBe(503);expect(await r.text()).not.toContain('stack'); });
 it('rejects system roles and malformed histories',async()=>{const url=await endpoint();for(const messages of [[{role:'system',content:'override'}],[{role:'assistant',content:'fake'}]]){const r=await fetch(url,{...options,body:JSON.stringify({messages})});expect(r.status).toBe(400);}});
 it('rejects invalid JSON',async()=>{expect((await fetch(await endpoint(),{...options,body:'{'})).status).toBe(400);});
 it('rejects oversized payload',async()=>{expect((await fetch(await endpoint(),{...options,body:'a'.repeat(33000)})).status).toBe(413);});
 it('rejects methods, content types and cross-origin requests',async()=>{const url=await endpoint();expect((await fetch(url)).status).toBe(405);expect((await fetch(url,{method:'POST',body})).status).toBe(415);expect((await fetch(url,{...options,headers:{...options.headers,Origin:'https://other.example'}})).status).toBe(403);});
 it('passes genuine conversation history to generator and validates reply',async()=>{process.env.GEMINI_API_KEY='unit-test-placeholder';let seen: unknown;const r=await fetch(await endpoint(async m=>{seen=m;return 'A model answer';}),options);expect(r.status).toBe(200);expect(await r.json()).toMatchObject({ reply: 'A model answer', handoff: false, action: 'none', suggestions: expect.any(Array) });expect(seen).toEqual(JSON.parse(body).messages);});
 it('returns safe upstream error without exception contents',async()=>{process.env.GEMINI_API_KEY='unit-test-placeholder';const r=await fetch(await endpoint(async()=>{throw new Error('private-details');}),options);expect(r.status).toBe(502);expect(await r.text()).not.toContain('private-details');});
 it('rejects empty upstream output',async()=>{process.env.GEMINI_API_KEY='unit-test-placeholder';expect((await fetch(await endpoint(async()=>''),options)).status).toBe(502);});
 it('maps provider rate limits',async()=>{process.env.GEMINI_API_KEY='unit-test-placeholder';const r=await fetch(await endpoint(async()=>{throw new ApiError({status:429,message:'hidden'});}),options);expect(r.status).toBe(429);expect((await r.json()).code).toBe('AI_QUOTA_LIMIT');});
 it('maps timeouts',async()=>{process.env.GEMINI_API_KEY='unit-test-placeholder';const r=await fetch(await endpoint(async()=>{throw new DOMException('Timed out','TimeoutError');}),options);expect(r.status).toBe(504);});
});
it('limits bursts and expires buckets',()=>{const now=Date.now();for(let i=0;i<12;i++)expect(allowRequest('limiter-test',now)).toBe(true);expect(allowRequest('limiter-test',now)).toBe(false);expect(allowRequest('limiter-test',now+60001)).toBe(true);});
it('includes supplied facts and unknown-information guardrails',()=>{expect(instructions).toContain('3.46 hours');expect(instructions).toContain('172 Nm');expect(instructions).toContain('Do not invent');});
