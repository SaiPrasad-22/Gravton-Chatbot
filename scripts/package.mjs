// A deployment ZIP excludes private environment files, even after local testing.
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
import archiver from 'archiver';
const root=process.cwd(); const release=path.join(root,'release'); await mkdir(release,{recursive:true});
const out=path.join(release,'Gravton-Chatbot-Knowledge-Deploy.zip');
const excluded=new Set(['node_modules','dist','.git','.vercel','release','coverage']);
const files=[];
async function collect(dir) {
 for(const entry of await readdir(dir,{withFileTypes:true})) {
  if(excluded.has(entry.name) || (entry.name.startsWith('.env') && entry.name!=='.env.example')) continue;
  const full=path.join(dir,entry.name);if((await lstat(full)).isSymbolicLink()) continue;
  if(entry.isDirectory())await collect(full);else if(entry.isFile())files.push(full);
 }
}
await collect(root);
for(const file of files) {
 if(/\.(ts|tsx|js|mjs|json|md|html|txt)$/.test(file)||file.endsWith('.env.example')) {
  const text=await readFile(file,'utf8');
  if(/AIza[0-9A-Za-z_-]{30,}|sk-[0-9A-Za-z_-]{20,}/.test(text))throw new Error('A possible API key was found. Remove secrets from source before packaging.');
 }
}
await new Promise((resolve,reject)=>{
 const output=createWriteStream(out);const zip=archiver('zip',{zlib:{level:9}});
 output.on('close',resolve);output.on('error',reject);zip.on('error',reject);zip.on('warning',reject);zip.pipe(output);
 for(const file of files)zip.file(file,{name:'gravton-chatbot-gemini/'+path.relative(root,file)});
 void zip.finalize();
});
console.log('Created release/Gravton-Chatbot-Knowledge-Deploy.zip. Private .env files are excluded.');
console.log('Set GEMINI_API_KEY and GEMINI_MODEL in Vercel before redeploying.');
