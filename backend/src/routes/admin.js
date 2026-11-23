import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import mongoose from 'mongoose';
import { settings } from '../config.js';
import { requireAdmin } from '../middleware/auth.js';
import Certificate from '../models/Certificate.js';
import Slot from '../models/Slot.js';
import Student from '../models/Student.js';
import { topics } from '../utils/dataLoader.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { csvRow } from '../utils/security.js';

// Everything under /api/admin needs an admin session (see routes/auth.js -> POST /api/auth/admin/login).
const router = Router();
router.use(requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const needId = (id) => { if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Student not found.'); return id; };
const best = (s) => Math.max(0, ...(s.quizResults ?? []).map((q) => q.score));

const summary = (s) => ({
  id: String(s._id), name: s.name, email: s.email, school: s.school, class_name: s.className, city: s.city, team: s.team,
  created_at: s.createdAt, last_login_at: s.lastLoginAt ?? null,
  topics_learned: s.learnedTopics?.length ?? 0, quiz_attempts: s.quizResults?.length ?? 0, best_quiz: best(s),
  sims_done: s.sims?.length ?? 0, games_won: s.gamesWon ?? 0,
  event_registered: !!s.event?.registeredAt, submitted: !!s.event?.submission?.at, evaluated: !!s.event?.evaluation?.at,
  total: s.event?.evaluation?.total ?? null, award: s.event?.evaluation?.award ?? null,
});

const COLS = 'name email school className city team createdAt lastLoginAt learnedTopics quizResults sims gamesWon event.registeredAt event.submission.at event.evaluation.at event.evaluation.total event.evaluation.award';

/** Overview numbers for the dashboard (computed in memory: fine for a school-sized user base). */
router.get('/stats', asyncHandler(async (_req, res) => {
  const rows = await Student.find().select(`${COLS} feedback.overall`).sort({ createdAt: -1 }).lean();
  const certificates = await Certificate.countDocuments();
  const total = rows.length;
  const dayAgo = Date.now() - 7 * 86_400_000;
  const count = (list, key) => Object.entries(list.reduce((m, v) => ((m[v] = (m[v] ?? 0) + 1), m), {})).map(([k, n]) => ({ [key]: k, count: n })).sort((a, b) => b.count - a.count);

  const attempts = rows.reduce((n, s) => n + (s.quizResults?.length ?? 0), 0);
  const passed = rows.reduce((n, s) => n + (s.quizResults ?? []).filter((q) => q.passed).length, 0);
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10));
  const perDay = Object.fromEntries(days.map((d) => [d, 0]));
  rows.forEach((s) => { const d = new Date(s.createdAt).toISOString().slice(0, 10); if (d in perDay) perDay[d] += 1; });
  const simUse = rows.flatMap((s) => (s.sims ?? []).map((x) => x.simId));

  res.json({
    totals: {
      students: total,
      new_7d: rows.filter((s) => new Date(s.createdAt).getTime() >= dayAgo).length,
      event_registered: rows.filter((s) => s.event?.registeredAt).length,
      submitted: rows.filter((s) => s.event?.submission?.at).length,
      evaluated: rows.filter((s) => s.event?.evaluation?.at).length,
      certificates,
      feedback: rows.filter((s) => s.feedback?.overall).length,
    },
    learning: {
      total_topics: topics().length,
      avg_topics_learned: total ? Math.round((rows.reduce((n, s) => n + (s.learnedTopics?.length ?? 0), 0) / total) * 10) / 10 : 0,
      course_completed: rows.filter((s) => (s.learnedTopics?.length ?? 0) >= topics().length).length,
      quiz_attempts: attempts,
      quiz_pass_rate: attempts ? Math.round((passed / attempts) * 100) : 0,
      sims_completed: simUse.length,
      games_won: rows.reduce((n, s) => n + (s.gamesWon ?? 0), 0),
    },
    by_class: count(rows.map((s) => s.className || '-'), 'class_name'),
    by_school: count(rows.map((s) => s.school || '-'), 'school').slice(0, 8),
    simulations: count(simUse, 'sim_id'),
    signups: days.map((date) => ({ date, count: perDay[date] })),
    recent: rows.slice(0, 5).map(summary),
  });
}));

router.get('/students', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const q = String(req.query.search ?? '').trim().slice(0, 80);
  const cls = String(req.query.class_name ?? '').trim().slice(0, 10);
  const filter = {};
  if (q) { const rx = new RegExp(escapeRegex(q), 'i'); filter.$or = [{ name: rx }, { email: rx }, { school: rx }]; }
  if (cls) filter.className = cls;
  const [total, rows, classes] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter).select(COLS).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Student.distinct('className'),
  ]);
  res.json({ total, page, limit, classes: classes.filter(Boolean).sort(), items: rows.map(summary) });
}));

router.get('/students/:id', asyncHandler(async (req, res) => {
  const s = await Student.findById(needId(req.params.id)).lean();      // tokenHash / passwordHash are never selected
  if (!s) throw new HttpError(404, 'Student not found.');
  const e = s.event ?? {};
  res.json({
    ...summary(s), parent_email: s.parentEmail, quiz_level: s.quizLevel,
    learned_topics: (s.learnedTopics ?? []).map((x) => x.topicId).sort((a, b) => a - b),
    topic_results: (s.topicResults ?? []).map((r) => ({ topic_id: r.topicId, score: r.score, total: r.total, passed: r.passed, at: r.at })),
    quiz_results: [...(s.quizResults ?? [])].reverse().map((r) => ({ level: r.level, score: r.score, passed: r.passed, at: r.at })),
    sims: (s.sims ?? []).map((x) => ({ sim_id: x.simId, at: x.at })),
    game_best: s.gameBest ?? [],
    feedback: s.feedback?.overall ? s.feedback : null,
    event: {
      registered_at: e.registeredAt ?? null, slot: e.slot?.date ? e.slot : null,
      project: e.project?.title ? { title: e.project.title, problem: e.project.problem, description: e.project.description } : null,
      submission: e.submission?.at ? { file_name: e.submission.fileName, link: e.submission.link, at: e.submission.at } : null,   // the file path stays on the server
      evaluation: e.evaluation?.at ? { scores: e.evaluation.scores, total: e.evaluation.total, remark: e.evaluation.remark, award: e.evaluation.award, cert_id: e.evaluation.certId, at: e.evaluation.at } : null,
    },
  });
}));

/** Removes the account and everything linked to it (same clean-up as DELETE /api/me). */
router.delete('/students/:id', asyncHandler(async (req, res) => {
  const s = await Student.findById(needId(req.params.id));
  if (!s) throw new HttpError(404, 'Student not found.');
  const slot = s.event?.slot;
  if (slot?.date) await Slot.updateOne({ date: slot.date, time: slot.time }, { $pull: { bookedBy: s._id } });
  await Certificate.deleteMany({ studentId: s._id });
  await fs.rm(path.join(settings.uploadDir, String(s._id)), { recursive: true, force: true });
  await Student.deleteOne({ _id: s._id });
  res.status(204).end();
}));

router.get('/export/students.csv', asyncHandler(async (_req, res) => {
  const rows = (await Student.find().select(COLS).sort({ createdAt: 1 }).lean()).map(summary);
  const head = ['Name', 'Email', 'School', 'Class', 'City', 'Team', 'Joined', 'Last login', 'Topics learned', 'Quiz attempts', 'Best quiz score', 'Simulations done', 'Games won', 'Event registered', 'Submitted', 'Evaluation total', 'Award'];
  const lines = rows.map((r) => csvRow([r.name, r.email, r.school, r.class_name, r.city, r.team, r.created_at && new Date(r.created_at).toISOString(), r.last_login_at && new Date(r.last_login_at).toISOString(),
    r.topics_learned, r.quiz_attempts, r.best_quiz, r.sims_done, r.games_won, r.event_registered ? 'yes' : 'no', r.submitted ? 'yes' : 'no', r.total ?? '', r.award ?? '']));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
  res.send(`\ufeff${[csvRow(head), ...lines].join('\r\n')}\r\n`);
}));

router.get('/certificates', asyncHandler(async (_req, res) => {
  const rows = await Certificate.find().sort({ createdAt: -1 }).limit(500).populate('studentId', 'name email school className').lean();
  res.json(rows.map((c) => ({
    cert_id: c.certId, kind: c.kind, title: c.title, score: c.score ?? null, created_at: c.createdAt,
    student: c.studentId ? { name: c.studentId.name, email: c.studentId.email, school: c.studentId.school, class_name: c.studentId.className } : null,
  })));
}));

export default router;
