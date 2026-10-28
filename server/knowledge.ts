import { records, type RecordEntry } from './knowledge/records.js';
import sources from './knowledge/sources.json' with { type: 'json' };
import { SALES_FALLBACK, EMI_START, EMI_EXACT } from '../shared/messages.js';
import { PUBLIC_SOURCE_LABELS } from './knowledge/public-sources.js';
export { SALES_FALLBACK };
export type History = { role: 'user' | 'assistant'; content: string }[];
const sourceMap = new Map(sources.map(s => [s.id, s]));
import { instructions } from './config/prompt.js';
export { instructions };
const normalize = (s: string) => s.toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
const searchable = (s:string) => s.replace(/\b(the|my|your|a|an|do|does|i|to)\b/gi,' ').replace(/\s+/g,' ').trim();
const phrase = (query: string, topic: string) => new RegExp('(^|[^a-z0-9])'+searchable(topic).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(s)?($|[^a-z0-9])','i').test(searchable(query));
export function matchingRecords(query: string): RecordEntry[] {
 const q=normalize(query);
 const explicitOther = /\bparticle\b/.test(q) ? 'particle' : /\barq\b/.test(q) ? 'arq' : undefined;
 let found=records.map(r=>({r,score:r.topics.reduce((n,t)=>n+(phrase(q,t)?t.split(' ').length:0),0)})).filter(x=>x.score>0);
 if(explicitOther) found=found.filter(x=>x.r.id===explicitOther);
 else found=found.filter(x=>!['particle','arq'].includes(x.r.id));
 const sOnly=/\bquanta s\b(?!\s*\+)/.test(q) && !/s\s*\+|s plus|splus/.test(q);
 found=found.filter(x=>x.r.id!==(sOnly?'splus-mode-range':'s-mode-range') && (x.r.id!=='s-capacity'||sOnly));
 return found.sort((a,b)=>b.score-a.score).slice(0,12).map(x=>x.r).filter(r=>r.sources.every(id=>!!sourceMap.get(id)?.text));
}
export function retrievalQuery(messages: History) {
 const current=messages.at(-1)?.content||'';
 // Topic-less follow-ups can use the last user question. Never carry unsupported claims forward.
 if(matchingRecords(current).length || current.length>80) return current;
 if(/^(and |what about |how about |for |same |that |it |quanta s)/i.test(current)) {
  const prev=messages.slice(0,-1).filter(m=>m.role==='user').at(-1)?.content;
  if(prev)return `${prev}\nFollow-up: ${current}`;
 }
 return current;
}
export function forcedAnswer(query: string): string | undefined {
 const q=normalize(query);
 if(/ignore.{0,35}(rule|instruction)|system prompt|api.?key|write.{0,20}(code|poem|essay)|\b(python|javascript|politics|cricket|weather|capital of|tesla|ather|ola scooter|recipe)\b/.test(q)) return SALES_FALLBACK;
 if(/\b(emi|financ\w*|loan|instal+ment|monthly payment|down payment)\b/.test(q)) {
  if(/\b(exact|calculat\w*|interest|tenure|down payment|partner|cashee|shriram|sri ram|no.cost|zero.cost|approval|eligib\w*|months|years|percent|rate)\b/.test(q)||/\d/.test(q))return EMI_EXACT;
  // Unrelated or additional technical requests must still be screened by the selector.
  if(!/\b(and|also|plus)\b/.test(q))return EMI_START;
 }
 const sOnly=/\bquanta s\b(?!\s*\+)/.test(q)&& !/s\s*\+|s plus|splus/.test(q);
 if(/seat height|saddle height|\bgvw\b|gvwr|gross.{0,15}weight|payload|load capacity|carry.{0,20}(kg|kilo)|maximum load|pull capacity/.test(q)) return SALES_FALLBACK;
 if(!sOnly && /battery.{0,25}(capacity|size|kwh|kilowatt)|\bkwh\b|\b3\.8/.test(q))return SALES_FALLBACK;
 if(/display.{0,20}(size|inch|type|lcd|led)|screen.{0,20}(size|inch)|cluster.{0,20}(size|inch)|gotac.{0,20}(stand|full|mean)|full form/.test(q))return SALES_FALLBACK;
 if(/(service|maintenance).{0,25}(interval|schedule|when|often|days|months|free)|when.{0,25}(service|maintenance)|second service|first service/.test(q))return SALES_FALLBACK;
 if(/(storage|store|idle|unused|holiday).{0,35}(charge|soc|percent|%|days)|how often.{0,20}charg|every.{0,15}days|maintain.{0,15}(soc|charge)|battery.{0,25}(temperature|heat)|safe.{0,20}temperature/.test(q))return SALES_FALLBACK;
 if(sOnly && /20.{0,6}(90|30)|partial charg/.test(q))return SALES_FALLBACK;
 if(/\b(price|discount|stock|delivery|available today|availability|on.road|ex.showroom|nearest showroom|dealer investment|dealership cost)\b/.test(q))return SALES_FALLBACK;
 return undefined;
}
export type Citation = { file: string; location: string };
export type Selection = { answer: string; citations: Citation[]; publicSources: string[] };
// Validates the model's selection and returns the reviewed prose plus the INTERNAL citations (file and page). The citations are used for
// validation and tests and are never shown to customers: see approvedAnswer.
export function approvedSelection(raw: string, candidates: RecordEntry[]): Selection | undefined {
 let parsed: unknown;try{parsed=JSON.parse(raw);}catch{return undefined;}
 if(!parsed||typeof parsed!=='object'||!('supported' in parsed)||parsed.supported!==true||!('ids' in parsed)||!Array.isArray(parsed.ids)||!parsed.ids.length||parsed.ids.length>3)return undefined;
 if(Object.keys(parsed).some(k=>!['supported','ids'].includes(k)))return undefined;
 const ids=parsed.ids as unknown[];
 if(new Set(ids).size!==ids.length)return undefined;
 const selected=ids.map(id=>candidates.find(r=>r.id===id));
 if(selected.some(r=>!r))return undefined;
 const used=selected as RecordEntry[];
 const refs=[...new Set(used.flatMap(r=>r.sources))].map(id=>sourceMap.get(id));
 if(refs.some(r=>!r?.text))return undefined;
 const citations=[...new Map(refs.map(r=>[`${r!.file}|${r!.location}`,{file:r!.file,location:r!.location}])).values()];
 const publicSources=[...new Set(citations.map(c=>PUBLIC_SOURCE_LABELS[c.file]).filter((x):x is string=>!!x))];
 return { answer: used.map(r=>r.answer).join('\n\n'), citations, publicSources };
}
// What the customer sees: the reviewed answer only. With `publicSources` (the customer asked where it comes from) the answer ends with the
// public document titles from public-sources.ts: never file names, page numbers or internal labels.
export function approvedAnswer(raw: string, candidates: RecordEntry[], options: { publicSources?: boolean } = {}): string {
 const selection=approvedSelection(raw,candidates);
 if(!selection)return SALES_FALLBACK;
 return options.publicSources&&selection.publicSources.length ? selection.answer+'\n\n'+SOURCE_NOTE(selection.publicSources) : selection.answer;
}
// ---- Explicit requests for a source
export const sourceRequested = (query: string) => /\b(sources?|references?|citations?|cite|proof|evidence|where (did|do|does) (you|that|this|it)[^?.]{0,25}(get|find|take|come)|which (document|pdf|manual|brochure|booklet|guide|file)|based on what|how do you know|official (document|link))\b/i.test(query);
const join=(items:string[])=>items.length<2?items.join(''):items.slice(0,-1).join(', ')+' and '+items.at(-1);
const SOURCE_NOTE=(labels:string[])=>`This information comes from ${join(labels)}. Our sales team can share the latest official documents on WhatsApp.`;
export const GENERIC_SOURCE_NOTE="My answers come from Gravton’s official Quanta product information. Our sales team can share the latest official documents on WhatsApp.";
// "Where did you get that?" after an answer: find which reviewed records that answer was built from and name only their public titles.
export function sourceNoteFor(messages: History): string {
 const previous=[...messages].reverse().find(m=>m.role==='assistant')?.content;
 if(!previous||previous===SALES_FALLBACK)return GENERIC_SOURCE_NOTE;
 const used=records.filter(r=>previous.includes(r.answer));
 const labels=[...new Set(used.flatMap(r=>r.sources).map(id=>sourceMap.get(id)?.file).map(f=>f&&PUBLIC_SOURCE_LABELS[f]).filter((x):x is string=>!!x))];
 return labels.length?SOURCE_NOTE(labels):GENERIC_SOURCE_NOTE;
}
