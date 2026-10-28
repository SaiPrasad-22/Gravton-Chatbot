import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { leadHandler } from './server/lead';
import { createHandler } from './server/chat';
export default defineConfig(({ mode }) => {
  // Server-side configuration only. Never copy these values into define or VITE_*.
  const env = loadEnv(mode, process.cwd(), 'GEMINI_');
  for (const name of ['GEMINI_API_KEY', 'GEMINI_MODEL']) if (!process.env[name] && env[name]) process.env[name] = env[name];
  return { plugins: [react(), { name: 'local-chat-api', configureServer(server) {
    server.middlewares.use('/api/chat', createHandler());
    server.middlewares.use('/api/lead', leadHandler);
  }}], server: { port: 4173, allowedHosts: ['terminal.local'] } };
});
