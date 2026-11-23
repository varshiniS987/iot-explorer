// Merges the progress a student collected in the browser into their server record (pure functions, no database).
// Rule: the merge only ADDS or IMPROVES data. A fresh browser can never wipe progress stored on the server.

const asDate = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const trim = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** `student` is a plain object (doc.toObject() / lean). Returns a MongoDB $set document. */
export function mergeProgress(student, snap) {
  const set = {};

  // --- learning
  const learned = new Map((student.learnedTopics ?? []).map((x) => [x.topicId, x]));
  for (const id of snap.learned_topics ?? []) if (!learned.has(id)) learned.set(id, { topicId: id, at: new Date() });
  set.learnedTopics = [...learned.values()].sort((a, b) => a.topicId - b.topicId);

  const comps = new Map((student.learnedComponents ?? []).map((x) => [x.componentId, x]));
  for (const id of snap.learned_components ?? []) if (!comps.has(id)) comps.set(id, { componentId: id, at: new Date() });
  set.learnedComponents = [...comps.values()];

  const results = new Map((student.topicResults ?? []).map((x) => [x.topicId, x]));
  for (const r of snap.topic_results ?? []) {
    const old = results.get(r.topic_id);
    const better = !old || (r.passed && !old.passed) || (r.passed === old.passed && r.score > old.score);
    if (better) results.set(r.topic_id, { topicId: r.topic_id, score: r.score, total: r.total, passed: r.passed, at: asDate(r.at) ?? new Date() });
  }
  set.topicResults = [...results.values()];

  const quizKey = (q) => `${q.level}|${q.score}|${new Date(q.at).toISOString()}`;
  const quizzes = [...(student.quizResults ?? [])];
  const seen = new Set(quizzes.map(quizKey));
  for (const q of snap.quiz_results ?? []) {
    const at = asDate(q.at);
    if (!at) continue;
    const item = { level: q.level, score: q.score, passed: q.passed, answers: [], at };
    if (!seen.has(quizKey(item))) { seen.add(quizKey(item)); quizzes.push(item); }
  }
  set.quizResults = quizzes.sort((a, b) => new Date(a.at) - new Date(b.at)).slice(-50);

  // --- simulations (union) and games (best score per level)
  const sims = new Map((student.sims ?? []).map((x) => [x.simId, x]));
  for (const id of snap.sims ?? []) if (!sims.has(id)) sims.set(id, { simId: id, at: new Date() });
  set.sims = [...sims.values()];

  const games = new Map((student.gameBest ?? []).map((g) => [g.level, { level: g.level, score: g.score, stars: g.stars }]));
  for (const g of snap.game_best ?? []) {
    const old = games.get(g.level);
    games.set(g.level, { level: g.level, score: Math.max(old?.score ?? 0, g.score), stars: Math.max(old?.stars ?? 0, g.stars) });
  }
  set.gameBest = [...games.values()];
  set.gamesWon = Math.max(student.gamesWon ?? 0, snap.games_won ?? 0);
  if (snap.quiz_level) set.quizLevel = snap.quiz_level;

  // --- profile (only non-empty values)
  const p = snap.profile ?? {};
  if (trim(p.name, 80).length >= 2) set.name = trim(p.name, 80);
  if (trim(p.school, 120).length >= 2) set.school = trim(p.school, 120);
  if (trim(p.class_name, 10)) set.className = trim(p.class_name, 10);
  if (trim(p.city, 80)) set.city = trim(p.city, 80);

  // --- feedback (kept once; never overwritten from the browser)
  if (snap.feedback && !student.feedback?.overall) set.feedback = { ...snap.feedback, at: asDate(snap.feedback.at) ?? new Date() };

  // --- event (registration, project, slot and submission details; the evaluation is decided only by the admin)
  const ev = snap.event;
  if (ev?.profile) {
    const old = student.event ?? {};
    if (!old.registeredAt) set['event.registeredAt'] = asDate(ev.profile.at) ?? new Date();
    if (trim(ev.profile.team, 80)) set.team = trim(ev.profile.team, 80);
    if (trim(ev.profile.city, 80)) set.city = trim(ev.profile.city, 80);
    if (trim(ev.profile.parent_email, 120)) set.parentEmail = trim(ev.profile.parent_email, 120).toLowerCase();
    if (ev.project?.title) set['event.project'] = { ...ev.project, at: new Date() };
    if (ev.slot?.date) set['event.slot'] = { date: ev.slot.date, time: ev.slot.time, mode: ev.slot.mode, at: new Date() };
    const hasFile = !!old.submission?.filePath;                       // a real upload is never replaced by browser data
    if (ev.submission && !hasFile) set['event.submission'] = { fileName: ev.submission.file_name, fileSize: ev.submission.file_size, link: ev.submission.link, at: asDate(ev.submission.at) ?? new Date() };
  }
  return set;
}

/** What the browser needs back after a sync (server data wins for the evaluation). */
export function progressOf(student) {
  const e = student.event ?? {};
  return {
    profile: { name: student.name, school: student.school, class_name: student.className },
    learned_topics: (student.learnedTopics ?? []).map((x) => x.topicId),
    learned_components: (student.learnedComponents ?? []).map((x) => x.componentId),
    certificate_id: null,                                   // filled in by the route (certificates live in their own collection)
    topic_results: (student.topicResults ?? []).map((r) => ({ topic_id: r.topicId, score: r.score, total: r.total, passed: r.passed, date: r.at })),
    sims: (student.sims ?? []).map((x) => x.simId),
    game_best: (student.gameBest ?? []).map((g) => ({ level: g.level, score: g.score, stars: g.stars })),
    games_won: student.gamesWon ?? 0,
    quiz_level: student.quizLevel,
    evaluation: e.evaluation?.at ? { scores: e.evaluation.scores, total: e.evaluation.total, remark: e.evaluation.remark, award: e.evaluation.award, at: e.evaluation.at } : null,
    cert_id: e.evaluation?.certId ?? null,
  };
}
