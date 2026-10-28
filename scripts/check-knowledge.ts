import { records } from '../server/knowledge/records';
import sources from '../server/knowledge/sources.json' with { type: 'json' };
import manifest from '../server/knowledge/manifest.json' with { type: 'json' };
import assert from 'node:assert/strict';
assert.equal(manifest.length,5);assert.equal(new Set(sources.map(s=>s.id)).size,sources.length);assert.equal(new Set(records.map(r=>r.id)).size,records.length);
for(const r of records){assert(r.answer.length<1200);assert(r.topics.length>0);for(const id of r.sources)assert(sources.find(s=>s.id===id)?.text,`Missing evidence for ${r.id}: ${id}`);}
for(const file of manifest)assert(records.some(r=>r.sources.some(id=>sources.find(s=>s.id===id)?.file===file.filename)),`No reviewed answers from ${file.filename}`);
console.log(`${manifest.length} documents; ${sources.length} indexed sections; ${records.length} reviewed answer records. References resolve.`);
