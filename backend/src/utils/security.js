// Password hashing, admin session tokens and CSV helpers. Pure functions (no database) so they can be unit-tested offline.
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

/** Constant-time string comparison (hashes first, so the lengths never leak). */
export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** scrypt with a random 16-byte salt. Stored as  scrypt$<salt>$<hash>  (both base64). */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(password), salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [alg, salt, key] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !key) return false;
  const want = Buffer.from(key, 'base64');
  const got = await scrypt(String(password), Buffer.from(salt, 'base64'), want.length);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const mac = (body, secret) => crypto.createHmac('sha256', secret).update(body).digest('base64url');

/** Signed, expiring admin session token:  <payload>.<hmac>  (nothing secret inside the payload). */
export function signAdminToken(email, secret, hours = 8, now = Date.now()) {
  const body = enc({ sub: email, role: 'admin', exp: now + hours * 3_600_000 });
  return `${body}.${mac(body, secret)}`;
}

/** Returns the payload when the signature is valid and the token has not expired, otherwise null. */
export function verifyAdminToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig || !safeEqual(sig, mac(body, secret))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.role === 'admin' && typeof p.exp === 'number' && p.exp > now ? p : null;
  } catch { return null; }
}

/** One CSV cell. Cells that start with = + - @ are prefixed with ' so Excel never runs them as formulas. */
export function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export const csvRow = (cells) => cells.map(csvCell).join(',');
