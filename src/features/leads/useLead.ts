import { useRef, useState } from 'react';
import { leadSchema, type Lead } from '../../../shared/lead';
// randomUUID requires HTTPS; getRandomValues also supports HTTP development previews.
export function conversationId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function useLead(){
 const [lead,setLead]=useState<Lead|null>(null);const latest=useRef<Lead|null>(null);const lock=useRef(false);
 const [busy,setBusy]=useState(false);const [detailsDismissed,setDetailsDismissed]=useState(false);
 const [identity]=useState(()=>({conversationId:conversationId(),createdAt:new Date().toISOString()}));
 async function capture(values: Partial<Lead>, source:Lead['source']):Promise<boolean>{
  if(lock.current)return false;
  const previous=latest.current;
  const next={...identity,source,interest:source,consentStatus:'not-requested' as const,...previous,...values};
  const parsed=leadSchema.safeParse(next);if(!parsed.success)throw new Error('Please enter a valid 10-digit mobile number and check your details.');
  if(previous&&JSON.stringify(previous)===JSON.stringify(parsed.data))return true;
  lock.current=true;setBusy(true);const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),10000);
  try{
   const r=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(parsed.data),signal:abort.signal});
   const data=await r.json();if(!r.ok||data.accepted!==true||data.persisted!==false||data.notified!==false)throw new Error('We could not confirm your details. Please retry.');
   latest.current=parsed.data;setLead(parsed.data);return true;
  }catch{throw new Error('We could not confirm your details. Please retry.');}
  finally{clearTimeout(timeout);lock.current=false;setBusy(false);}
 }
 return {lead,busy,capture,detailsDismissed,dismissDetails:()=>setDetailsDismissed(true)};
}
export type LeadController = ReturnType<typeof useLead>;
