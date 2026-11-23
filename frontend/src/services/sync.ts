import { useEffect } from 'react';
import { PROJECTS } from '../simulation/projects/index.js';
import { KIT_COMPONENTS } from '../data/kitComponents';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../store/useAuth';
import { api, getToken, type ServerProgress } from './api';

type AppSnapshot = ReturnType<typeof useAppStore.getState>;
const VALID_SIMS = new Set(PROJECTS.map((p) => p.id));
const VALID_COMPONENTS = new Set<string>(KIT_COMPONENTS.map((c) => c.id));

const cut = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const int = (v: unknown, min: number, max: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; };
const iso = (v: unknown) => { const d = new Date(String(v)); return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); };

/**
 * What the browser sends to PUT /api/me/sync. Every value is trimmed to the limits the server accepts,
 * because the server rejects the whole request when a single field is out of range.
 */
export function buildSnapshot(s: AppSnapshot) {
  const ev = s.event;
  const fb = s.feedback;
  const validFeedback = fb && [fb.overall, fb.usability, fb.learning].every((n) => n >= 1 && n <= 5) && cut(fb.favorite, 60);
  return {
    profile: { name: cut(s.studentName, 80), school: cut(s.schoolName, 120), class_name: cut(s.className, 10) },
    learned_topics: s.learnedTopics.filter((n) => Number.isInteger(n) && n >= 1 && n <= 999).slice(0, 200),
    topic_results: Object.entries(s.topicResults).slice(0, 200).map(([id, r]) => ({
      topic_id: int(id, 1, 999), score: int(r.score, 0, 1000), total: int(r.total, 0, 1000), passed: !!r.passed, at: iso(r.date),
    })),
    quiz_results: s.quiz ? [{ level: s.quizLevel, score: int(s.quiz.score, 0, 1000), passed: !!s.quiz.passed, at: iso(s.quiz.date) }] : [],
    sims: s.sims.filter((id) => VALID_SIMS.has(id)),
    learned_components: s.lessons.filter((id) => VALID_COMPONENTS.has(id)),          // 3D kit components that were viewed
    certificate_id: s.certificateId && /^EIS-\d{8}-[A-Z0-9]{4,10}$/.test(s.certificateId) ? s.certificateId : undefined,
    game_best: Object.entries(s.gameBest).slice(0, 50).map(([level, g]) => ({ level: cut(level, 32) || 'level', score: int(g.score, 0, 1_000_000), stars: int(g.stars, 0, 3) })),
    games_won: int(s.gamesWon, 0, 1_000_000),
    quiz_level: s.quizLevel,
    feedback: validFeedback && fb ? {
      name: cut(fb.name, 80), cls: cut(fb.cls, 10), school: cut(fb.school, 120), overall: int(fb.overall, 1, 5), usability: int(fb.usability, 1, 5), learning: int(fb.learning, 1, 5),
      favorite: cut(fb.favorite, 60), suggestions: cut(fb.suggestions, 1000), at: iso(fb.date),
    } : undefined,
    event: ev.profile ? {
      profile: { at: iso(ev.profile.at), team: cut(ev.profile.team, 80), city: cut(ev.profile.city, 80), parent_email: cut(ev.profile.parentEmail, 120) },
      project: ev.project?.title ? {
        title: cut(ev.project.title, 120), problem: cut(ev.project.problem, 1000), description: cut(ev.project.description, 3000),
        code: String(ev.project.code ?? '').slice(0, 20000), simId: cut(ev.project.simId, 64), topics: ev.project.topics.filter((n) => Number.isInteger(n) && n >= 1 && n <= 999).slice(0, 30),
      } : undefined,
      slot: ev.slot ? { date: cut(ev.slot.date, 20), time: cut(ev.slot.time, 20), mode: cut(ev.slot.mode, 60) } : undefined,
      submission: ev.submission ? { file_name: cut(ev.submission.fileName, 200), file_size: int(ev.submission.fileSize, 0, 1e9), link: cut(ev.submission.link, 500), at: iso(ev.submission.at) } : undefined,
    } : undefined,
  };
}

/** Merges what the server knows into the browser (adds or improves, never removes). Changes the store only when something differs. */
export function applyServer(p: ServerProgress) {
  const cur = useAppStore.getState();
  const patch: Partial<AppSnapshot> = {};

  const learned = [...new Set([...cur.learnedTopics, ...p.learned_topics])].sort((a, b) => a - b);
  if (learned.length !== cur.learnedTopics.length) patch.learnedTopics = learned;

  const sims = [...new Set([...cur.sims, ...p.sims.filter((id) => VALID_SIMS.has(id))])];
  if (sims.length !== cur.sims.length) patch.sims = sims;

  const lessons = [...new Set([...cur.lessons, ...p.learned_components.filter((id) => VALID_COMPONENTS.has(id))])] as typeof cur.lessons;
  if (lessons.length !== cur.lessons.length) patch.lessons = lessons;
  if (p.certificate_id && p.certificate_id !== cur.certificateId) patch.certificateId = p.certificate_id;   // the server keeps one certificate per student

  const results = { ...cur.topicResults };
  let resultsChanged = false;
  for (const r of p.topic_results) {
    const old = results[r.topic_id];
    if (!old || (r.passed && !old.passed) || (r.passed === old.passed && r.score > old.score)) {
      results[r.topic_id] = { score: r.score, total: r.total, passed: r.passed, date: r.date };
      resultsChanged = true;
    }
  }
  if (resultsChanged) patch.topicResults = results;

  const games = { ...cur.gameBest };
  let gamesChanged = false;
  for (const g of p.game_best) {
    const old = games[g.level];
    if (!old || g.score > old.score || g.stars > old.stars) { games[g.level] = { score: Math.max(g.score, old?.score ?? 0), stars: Math.max(g.stars, old?.stars ?? 0) }; gamesChanged = true; }
  }
  if (gamesChanged) patch.gameBest = games;
  if (p.games_won > cur.gamesWon) patch.gamesWon = p.games_won;

  if (!cur.studentName && p.profile.name) patch.studentName = p.profile.name;
  if (!cur.schoolName && p.profile.school) patch.schoolName = p.profile.school;
  if (!cur.className && p.profile.class_name) patch.className = p.profile.class_name;

  // The evaluation is decided by the admin on the server, so the server's copy always wins.
  if (p.evaluation && JSON.stringify(cur.event.evaluation) !== JSON.stringify(p.evaluation)) {
    patch.event = { ...cur.event, evaluation: p.evaluation, certId: p.cert_id ?? cur.event.certId };
  }
  if (Object.keys(patch).length) useAppStore.setState(patch);
}

/** Mounted once in App: while a student is logged in, keep the server copy of their progress up to date. */
export function useStudentSync() {
  const email = useAuth((s) => s.student?.email);
  useEffect(() => {
    if (!email || !getToken()) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = '';
    let busy = false;
    const push = async () => {
      if (busy || !getToken()) return;
      const snap = buildSnapshot(useAppStore.getState());
      const json = JSON.stringify(snap);
      if (json === last) return;
      busy = true;
      try { applyServer(await api.sync(snap)); last = json; }
      catch { /* offline or server down: the next change (or coming back online) retries */ }
      finally { busy = false; }
    };
    const schedule = () => { if (timer) clearTimeout(timer); timer = setTimeout(push, 1500); };
    void push();
    const unsub = useAppStore.subscribe(schedule);
    window.addEventListener('online', schedule);
    return () => { if (timer) clearTimeout(timer); unsub(); window.removeEventListener('online', schedule); };
  }, [email]);
}
