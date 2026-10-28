import { afterEach, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { leadHandler } from '../server/lead';
const servers:Server[]=[];
afterEach(async()=>{await Promise.all(servers.splice(0).map(s=>new Promise<void>(r=>s.close(()=>r()))));});
async function endpoint(){const s=createServer(leadHandler);servers.push(s);await new Promise<void>(r=>s.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${(s.address() as AddressInfo).port}`;}
const data={mobile:'9876543210',source:'ai-chat',interest:'range',conversationId:'3f2e52e7-3892-4825-bbf6-8d774d58e555',createdAt:'2026-10-24T10:00:00.000Z',consentStatus:'not-requested'};
const options=(body:unknown)=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
it('validates initial and updated leads without claiming persistence, notification or leaking details',async()=>{const url=await endpoint();for(const value of [data,{...data,name:'Asha',city:'Hyderabad'},data]){const r=await fetch(url,options(value));expect(r.status).toBe(200);expect(await r.json()).toEqual({accepted:true,persisted:false,notified:false});}});
it('rejects invalid mobile, unexpected consent and extra fields',async()=>{const url=await endpoint();for(const value of [{...data,mobile:'123'},{...data,mobile:'98765432101'},{...data,consentStatus:'marketing'},{...data,admin:true},{...data,name:'a'.repeat(101)}])expect((await fetch(url,options(value))).status).toBe(400);});
it('rejects cross-origin, methods and oversized data',async()=>{const url=await endpoint();expect((await fetch(url)).status).toBe(405);expect((await fetch(url,{...options(data),headers:{'Content-Type':'application/json',Origin:'https://elsewhere.example'}})).status).toBe(403);expect((await fetch(url,options({text:'a'.repeat(5000)}))).status).toBe(413);});
