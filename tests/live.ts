// Opt-in: sends synthetic questions to your running deployment and can consume Gemini quota.
import { SALES_FALLBACK } from '../shared/messages.js';
const base=process.argv[2]||'http://localhost:4173';
type Message={role:'user'|'assistant';content:string};
async function request(messages:Message[]){
 const response=await fetch(new URL('/api/chat',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages}),signal:AbortSignal.timeout(35000)});
 const data=await response.json();
 if(!response.ok)throw new Error(`Chat HTTP ${response.status}: ${data.code||''} ${data.error||'request failed'}`);
 if(typeof data.reply!=='string'||!data.reply.trim())throw new Error('No reply returned');
 return data.reply as string;
}
const cases:[string,RegExp][]=[
 ['What is the range of Quanta S+?',/165/],
 ['What colours does Quanta come in?',/Firey Red/i],
 ['How do I start the bike?',/MCB/],
 ['What tyre pressure does the Quanta S+ manual specify?',/34.*40/s],
 ['How do I log in to the Gravton app using OTP?',/OTP/],
 ['Is doorstep service available for Quanta S?',/location/i],
 ['What EMI options are available?',/3,000/],
 ['What is the battery capacity of Quanta S+?',/^Sorry,/],
 ['What is the capital of France?',/^Sorry,/],
 ['What is the exact on-road price today?',/^Sorry,/],
];
for(const [question,expected] of cases){
 const reply=await request([{role:'user',content:question}]);console.log(question+'\n'+reply+'\n');
 if(!expected.test(reply))throw new Error('Expected document-backed content or fallback was missing');
 if(expected.source==='^Sorry,'&&reply!==SALES_FALLBACK)throw new Error('Fallback text did not match');
}
console.log('10 live checks passed. Review relevance and source labels manually; these samples do not guarantee all model selections.');
