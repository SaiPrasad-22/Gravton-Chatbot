import { afterEach, expect, it, vi } from 'vitest';
import { generateGemini } from '../server/providers/gemini';
const oldKey=process.env.GEMINI_API_KEY;
afterEach(()=>{vi.unstubAllGlobals();if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;});
it('official Gemini SDK sends supplied facts and maps assistant history to model (mock transport)',async()=>{
 process.env.GEMINI_API_KEY='sdk-test-placeholder';
 let payload: Record<string,unknown> | undefined;
 vi.stubGlobal('fetch',async(input: RequestInfo | URL,init?:RequestInit)=>{
  const req=input instanceof Request?input:new Request(input,init);
  expect(req.url).toContain('https://generativelanguage.googleapis.com/');expect(req.url).toContain(':generateContent');expect(req.url).not.toContain('sdk-test-placeholder');
  expect(req.headers.get('x-goog-api-key')).toBe('sdk-test-placeholder');payload=await req.json();
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{role:'model',parts:[{text:JSON.stringify({supported:true,ids:['charge-time']})}]}}]}),{headers:{'Content-Type':'application/json'}});
 });
 const answer=await generateGemini([{role:'user',content:'Range?'},{role:'assistant',content:'Up to 165 km.'},{role:'user',content:'Charging time?'}]);
 expect(answer).toContain('3.46 hours');expect(JSON.stringify(payload?.systemInstruction)).toContain('APPROVED FACTS');expect(payload?.contents).toEqual([{role:'user',parts:[{text:'Range?'}]},{role:'model',parts:[{text:'Up to 165 km.'}]},{role:'user',parts:[{text:'Charging time?'}]}]);
});
it('handles safety-blocked responses without fabricating an answer',async()=>{process.env.GEMINI_API_KEY='sdk-test-placeholder';vi.stubGlobal('fetch',async()=>new Response(JSON.stringify({promptFeedback:{blockReason:'SAFETY'}}),{headers:{'Content-Type':'application/json'}}));await expect(generateGemini([{role:'user',content:'What is the range?'}])).rejects.toThrow('AI_RESPONSE_BLOCKED');});
it('rejects truncated output',async()=>{process.env.GEMINI_API_KEY='sdk-test-placeholder';vi.stubGlobal('fetch',async()=>new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{role:'model',parts:[{text:'partial'}]}}]}),{headers:{'Content-Type':'application/json'}}));await expect(generateGemini([{role:'user',content:'What is the range?'}])).rejects.toThrow('AI_INCOMPLETE_RESPONSE');});
