import { Router } from 'express';
import { z } from 'zod';
import { settings } from '../config.js';
import { adminEnabled, adminSecret, newToken, requireAdmin, requireStudent } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Student from '../models/Student.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { hashPassword, safeEqual, signAdminToken, verifyPassword } from '../utils/security.js';

const router = Router();

const email = z.string().trim().toLowerCase().max(120);
const loginIn = z.object({ email, password: z.string().min(1).max(100) });
const passwordIn = z.object({ password: z.string().min(6, 'at least 6 characters').max(100), current_password: z.string().max(100).optional() });

const brief = (s) => ({ id: s.id, name: s.name, email: s.email, school: s.school, class_name: s.className, city: s.city });

// A throw-away hash so that "unknown e-mail" takes as long as "wrong password" (no account enumeration by timing).
let dummyHash;
const dummy = async () => (dummyHash ??= await hashPassword('not-a-real-password'));

router.post('/auth/student/login', validate(loginIn), asyncHandler(async (req, res) => {
  const s = await Student.findOne({ email: req.body.email }).select('+passwordHash');
  const ok = await verifyPassword(req.body.password, s?.passwordHash || await dummy());
  if (!s || !s.passwordHash || !ok) throw new HttpError(401, 'Wrong e-mail or password.');
  const { token, tokenHash } = newToken();          // a new login replaces the previous session token
  await Student.updateOne({ _id: s._id }, { $set: { tokenHash, lastLoginAt: new Date() } });
  res.json({ token, student: brief(s) });
}));

/** Set a password (first time) or change it (needs the current one). */
router.post('/auth/student/password', requireStudent, validate(passwordIn), asyncHandler(async (req, res) => {
  const s = await Student.findById(req.student._id).select('+passwordHash');
  if (s.passwordHash && !(await verifyPassword(req.body.current_password ?? '', s.passwordHash))) throw new HttpError(403, 'Current password is wrong.');
  await Student.updateOne({ _id: s._id }, { $set: { passwordHash: await hashPassword(req.body.password) } });
  res.json({ ok: true });
}));

router.post('/auth/admin/login', validate(loginIn), asyncHandler(async (req, res) => {
  if (!adminEnabled()) throw new HttpError(503, 'Admin login is disabled: set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env.');
  const okEmail = safeEqual(req.body.email, settings.admin.email);      // both are always evaluated (constant time)
  const okPass = safeEqual(req.body.password, settings.admin.password);
  if (!(okEmail && okPass)) throw new HttpError(401, 'Wrong admin e-mail or password.');
  const token = signAdminToken(settings.admin.email, adminSecret(), settings.admin.tokenHours);
  res.json({ token, admin: { email: settings.admin.email }, expires_in_hours: settings.admin.tokenHours });
}));

router.get('/auth/admin/me', requireAdmin, (req, res) => res.json({ email: req.admin.email, role: 'admin' }));

export default router;
