import { z } from 'zod';
export const leadSchema = z.object({
 mobile:z.string().regex(/^\d{10}$/), name:z.string().trim().min(1).max(100).optional(), city:z.string().trim().min(1).max(120).optional(),
 source:z.enum(['ai-chat','test','dealer','showroom']), interest:z.string().trim().max(100), selectedModel:z.enum(['Quanta S+','Quanta S','Not sure']).optional(),
 conversationId:z.string().uuid(), createdAt:z.string().datetime(), consentStatus:z.literal('not-requested')
}).strict();
export type Lead = z.infer<typeof leadSchema>;
export function normalizeMobile(value: string, pasted = false) {
 let digits=value.replace(/\D/g,'');
 if(pasted && digits.length===12 && digits.startsWith('91'))digits=digits.slice(2);
 else if(pasted && digits.length===14 && digits.startsWith('0091'))digits=digits.slice(4);
 return digits;
}
export const validMobile = (value: string) => /^\d{10}$/.test(value);
