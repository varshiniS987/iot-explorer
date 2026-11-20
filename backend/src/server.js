import fs from 'node:fs';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { settings } from './config.js';
import { seedSlots } from './models/Slot.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run an async step up to `tries` times. Some networks reset the first Atlas connections (ECONNRESET). */
async function withRetry(label, fn, tries = 5, onError = () => {}) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= tries) throw err;
      onError(err);
      console.warn(`${label} failed (${String(err.message).split('\n')[0]}). Retry ${i}/${tries - 1} in 3 s...`);
      await sleep(3000);
    }
  }
}

/** Some routers/ISPs refuse the DNS SRV lookup that mongodb+srv:// needs (querySrv ECONNREFUSED). Use public DNS instead. */
let publicDns = false;
function usePublicDnsOnDnsError(err) {
  if (publicDns || !/querySrv|querytxt|ECONNREFUSED|ETIMEOUT|ENOTFOUND|EAI_AGAIN/i.test(String(err.message))) return;
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  publicDns = true;
  console.warn('System DNS could not resolve the database address. Switching to Google/Cloudflare DNS...');
}

async function main() {
  mongoose.set('strictQuery', true);
  await withRetry('MongoDB connect', () =>
    mongoose.connect(settings.mongoUri, {
      family: 4,                        // use IPv4 only (avoids ECONNRESET on networks with broken IPv6)
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
    }), 6, usePublicDnsOnDnsError);
  console.log('MongoDB connected');

  // These two steps must not stop the API from starting if the network hiccups.
  try { await withRetry('Index sync', () => mongoose.syncIndexes()); }       // make sure unique indexes exist
  catch (err) { console.warn('Index sync skipped (will run again on next start):', err.message); }
  try { await withRetry('Seeding slots', () => seedSlots()); }
  catch (err) { console.warn('Slot seeding skipped (will run again on next start):', err.message); }

  fs.mkdirSync(settings.uploadDir, { recursive: true });

  const server = createApp().listen(settings.port, () => console.log(`IoT Explorer API: http://localhost:${settings.port}  (health: /api/health)`));
  if (!settings.judgePin) console.warn('JUDGE_PIN is not set: judge/admin endpoints are disabled.');

  const stop = () => server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => { console.error('Startup failed:', err.message); process.exit(1); });