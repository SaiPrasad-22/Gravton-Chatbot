import { copyFile, access } from 'node:fs/promises';
try { await access('.env'); console.log('.env already exists. Edit GEMINI_API_KEY in that file; it was not overwritten.'); }
catch { await copyFile('.env.example','.env'); console.log('Created .env. Edit GEMINI_API_KEY privately, then run npm run dev.'); }
