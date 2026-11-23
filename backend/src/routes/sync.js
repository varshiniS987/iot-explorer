import { Router } from 'express';
import { z } from 'zod';
import { settings } from '../config.js';
import { requireStudent } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Certificate from '../models/Certificate.js';
import Student from '../models/Student.js';
import { makeCertificateId } from '../services/certificates.js';
import { mergeProgress, progressOf } from '../services/sync.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
const int = (min, max) => z.number().int().min(min).max(max);
const str = (max) => z.string().trim().max(max);
const iso = z.string().max(40);

export const snapshotIn = z.object({
  profile: z.object({ name: str(80), school: str(120), class_name: str(10), city: str(80) }).partial().optional(),
  learned_topics: z.array(int(1, 999)).max(200).default([]),
  learned_components: z.array(str(40).min(1)).max(60).default([]),
  certificate_id: z.string().regex(/^EIS-\d{8}-[A-Z0-9]{4,10}$/).optional(),
  topic_results: z.array(z.object({ topic_id: int(1, 999), score: int(0, 1000), total: int(0, 1000), passed: z.boolean(), at: iso.optional() })).max(200).default([]),
  quiz_results: z.array(z.object({ level: str(20), score: int(0, 1000), passed: z.boolean(), at: iso })).max(50).default([]),
  sims: z.array(str(64).min(1)).max(100).default([]),
  game_best: z.array(z.object({ level: str(32).min(1), score: int(0, 1_000_000), stars: int(0, 3) })).max(50).default([]),
  games_won: int(0, 1_000_000).default(0),
  quiz_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  feedback: z.object({
    name: str(80), cls: str(10), school: str(120), overall: int(1, 5), usability: int(1, 5), learning: int(1, 5),
    favorite: str(60), suggestions: str(1000).default(''), at: iso.optional(),
  }).optional(),
  event: z.object({
    profile: z.object({ at: iso.optional(), team: str(80).optional(), city: str(80).optional(), parent_email: str(120).optional() }),
    project: z.object({ title: str(120), problem: str(1000).default(''), description: str(3000).default(''), code: str(20000).default(''), simId: str(64).default(''), topics: z.array(int(1, 999)).max(30).default([]) }).optional(),
    slot: z.object({ date: str(20), time: str(20), mode: str(60) }).optional(),
    submission: z.object({ file_name: str(200).default(''), file_size: int(0, 1e9).default(0), link: str(500).default(''), at: iso.optional() }).optional(),
  }).optional(),
});

/** The browser sends what it has; the server merges (never deletes) and returns the merged progress. */
router.put('/me/sync', requireStudent, validate(snapshotIn), asyncHandler(async (req, res) => {
  const fresh = await Student.findById(req.student._id);
  // The server decides what counts as passed (never trust the flag sent by the browser).
  const body = { ...req.body, quiz_results: req.body.quiz_results.map((q) => ({ ...q, passed: q.score >= settings.passPercent })) };
  const saved = await Student.findByIdAndUpdate(fresh._id, { $set: mergeProgress(fresh.toObject(), body) }, { new: true });

  // Passing a quiz (60% or more) creates the certificate automatically: one course certificate per student.
  let certId = (await Certificate.findOne({ studentId: saved._id, kind: 'course' }))?.certId ?? null;
  const best = Math.max(-1, ...saved.quizResults.filter((r) => r.passed).map((r) => r.score));
  if (!certId && best >= 0) {
    const wanted = body.certificate_id && !(await Certificate.exists({ certId: body.certificate_id })) ? body.certificate_id : await makeCertificateId();
    try { certId = (await Certificate.create({ certId: wanted, studentId: saved._id, kind: 'course', title: 'Certificate of Completion', score: best })).certId; }
    catch { certId = (await Certificate.findOne({ studentId: saved._id, kind: 'course' }))?.certId ?? null; }   // created at the same moment by another request
  }
  res.json({ ...progressOf(saved.toObject()), certificate_id: certId });
}));

export default router;
