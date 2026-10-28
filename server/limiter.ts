import { createHash } from 'node:crypto';
// Best-effort per warm instance ONLY; configure Vercel Firewall before public launch.
// Not shared or durable across serverless instances. No IPs or messages are logged.
const buckets = new Map<string, { count: number; expires: number }>();
export function allowRequest(ip: string, now = Date.now()) {
  for (const [key, value] of buckets) if (value.expires <= now) buckets.delete(key);
  const key = createHash('sha256').update(ip).digest('hex');
  const current = buckets.get(key);
  if (current) { if (current.count >= 12) return false; current.count++; return true; }
  if (buckets.size >= 5000) return false;
  buckets.set(key, { count: 1, expires: now + 60_000 });
  return true;
}
