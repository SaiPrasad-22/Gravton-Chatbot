import { afterEach, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { ApiError } from '@google/genai';
import { createHandler } from '../server/chat';
import { configuredKey } from '../server/providers/gemini';
const oldKey=process.env.GEMINI_API_KEY;
let server: Server | undefined;
afterEach(async()=>{vi.restoreAllMocks();if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;if(server)await new Promise<void>(r=>server!.close(()=>r()));server=undefined;});
async function request(error: Error){
 process.env.GEMINI_API_KEY='test-placeholder';
 server=createServer(createHandler(async()=>{throw error;}));await new Promise<void>(r=>server!.listen(0,'127.0.0.1',r));
 return fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Charging?'}]})});
}
it('identifies free-tier quota without promising a one-minute recovery',async()=>{
 const response=await request(new ApiError({status:429,message:'private-provider-details'}));
 expect(response.status).toBe(429);expect(response.headers.get('Retry-After')).toBeNull();const result=await response.json();expect(result.code).toBe('AI_QUOTA_LIMIT');expect(JSON.stringify(result)).not.toContain('private-provider-details');
});
it('identifies invalid Google keys even when Google returns HTTP 400',async()=>{const response=await request(new ApiError({status:400,message:JSON.stringify({error:{details:[{reason:'API_KEY_INVALID'}]}})}));expect(response.status).toBe(503);expect((await response.json()).code).toBe('AI_CREDENTIAL_INVALID');});
it('identifies model permission failures safely',async()=>{const response=await request(new ApiError({status:403,message:'private-project-details'}));expect(response.status).toBe(503);expect((await response.json()).code).toBe('AI_ACCESS_UNAVAILABLE');});
it('rejects the editable template placeholder as unconfigured',()=>{process.env.GEMINI_API_KEY='PASTE_YOUR_GEMINI_API_KEY_HERE';expect(configuredKey()).toBeUndefined();process.env.GEMINI_API_KEY='  ';expect(configuredKey()).toBeUndefined();});
it('identifies account or regional preconditions without leaking provider messages',async()=>{const response=await request(new ApiError({status:400,message:JSON.stringify({error:{status:'FAILED_PRECONDITION',message:'private'}})}));expect(response.status).toBe(503);expect((await response.json()).code).toBe('AI_CONFIGURATION_ERROR');});
