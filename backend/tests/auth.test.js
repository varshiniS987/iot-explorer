// Runs offline:  npm test   (pure helpers only - no MongoDB needed)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeProgress, progressOf } from '../src/services/sync.js';
import { quizBank } from '../src/utils/dataLoader.js';
import { csvCell, csvRow, hashPassword, safeEqual, signAdminToken, verifyAdminToken, verifyPassword } from '../src/utils/security.js';

test('passwords are hashed with a random salt and verified', async () => {
  const a = await hashPassword('secret123');
  const b = await hashPassword('secret123');
  assert.notEqual(a, b);                                   // different salt every time
  assert.match(a, /^scrypt\$/);
  assert.equal(await verifyPassword('secret123', a), true);
  assert.equal(await verifyPassword('secret124', a), false);
  assert.equal(await verifyPassword('secret123', ''), false);
  assert.equal(await verifyPassword('secret123', 'plain-text'), false);
});

test('admin tokens: valid, expired, tampered and wrong secret', () => {
  const now = 1_000_000;
  const t = signAdminToken('admin@x.com', 'key', 8, now);
  assert.equal(verifyAdminToken(t, 'key', now + 1000).sub, 'admin@x.com');
  assert.equal(verifyAdminToken(t, 'key', now + 8 * 3_600_000 + 1), null);     // expired
  assert.equal(verifyAdminToken(t, 'other-key', now + 1000), null);            // wrong secret
  const [body, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'admin@x.com', role: 'admin', exp: now + 9e12 })).toString('base64url');
  assert.equal(verifyAdminToken(`${forged}.${sig}`, 'key', now + 1000), null); // payload changed, signature kept
  assert.equal(verifyAdminToken('garbage', 'key'), null);
  assert.equal(verifyAdminToken(undefined, 'key'), null);
  assert.ok(body.length > 10);
});

test('safeEqual compares strings of any length', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
});

test('CSV cells are quoted and formula-injection safe', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell('+1'), "'+1");
  assert.equal(csvCell(null), '');
  assert.equal(csvCell(0), '0');
  assert.equal(csvRow(['a', 'b,c', 3]), 'a,"b,c",3');
});

test('sync only adds or improves server data', () => {
  const server = {
    learnedTopics: [{ topicId: 1, at: new Date('2026-01-01') }, { topicId: 2, at: new Date('2026-01-02') }],
    topicResults: [{ topicId: 1, score: 9, total: 10, passed: true, at: new Date('2026-01-01') }],
    quizResults: [{ level: 'beginner', score: 8, passed: true, at: new Date('2026-01-05T10:00:00Z') }],
    sims: [{ simId: 'digital-dice', at: new Date() }],
    gameBest: [{ level: 'easy', score: 100, stars: 3 }], gamesWon: 5,
  };
  // a fresh browser (empty) must not remove anything
  const empty = mergeProgress(server, {});
  assert.equal(empty.learnedTopics.length, 2);
  assert.equal(empty.sims.length, 1);
  assert.equal(empty.gamesWon, 5);
  assert.equal(empty.quizResults.length, 1);

  const m = mergeProgress(server, {
    learned_topics: [2, 3],
    topic_results: [{ topic_id: 1, score: 4, total: 10, passed: false }, { topic_id: 2, score: 7, total: 10, passed: true }],
    quiz_results: [{ level: 'beginner', score: 8, passed: true, at: '2026-01-05T10:00:00Z' }, { level: 'beginner', score: 9, passed: true, at: '2026-01-06T10:00:00Z' }, { level: 'x', score: 1, passed: false, at: 'not a date' }],
    sims: ['digital-dice', 'traffic-light-controller'],
    game_best: [{ level: 'easy', score: 40, stars: 1 }, { level: 'hard', score: 10, stars: 1 }],
    games_won: 2,
    profile: { name: ' Asha ', school: 'GHSS', class_name: '8', city: '' },
  });
  assert.deepEqual(m.learnedTopics.map((x) => x.topicId), [1, 2, 3]);
  assert.equal(m.topicResults.find((r) => r.topicId === 1).score, 9);          // worse result does not replace the better one
  assert.equal(m.topicResults.find((r) => r.topicId === 2).passed, true);
  assert.equal(m.quizResults.length, 2);                                        // duplicate ignored, bad date ignored
  assert.deepEqual(m.sims.map((x) => x.simId).sort(), ['digital-dice', 'traffic-light-controller']);
  assert.equal(m.gameBest.find((g) => g.level === 'easy').score, 100);
  assert.equal(m.gameBest.find((g) => g.level === 'hard').score, 10);
  assert.equal(m.gamesWon, 5);
  assert.equal(m.name, 'Asha');
  assert.equal(m.className, '8');
  assert.equal('city' in m, false);                                            // empty values never overwrite
});

test('sync: event details are stored, a real upload is never replaced, the evaluation is read-only', () => {
  const snap = { event: { profile: { at: '2026-11-01T00:00:00Z', team: 'Volts' }, project: { title: 'Smart pot', problem: '', description: '', code: '', simId: '', topics: [] },
    submission: { file_name: 'a.pdf', file_size: 10, link: '' } }, feedback: { name: 'A', cls: '8', school: 'S', overall: 5, usability: 4, learning: 5, favorite: 'x', suggestions: '' } };
  const a = mergeProgress({}, snap);
  assert.ok(a['event.registeredAt'] instanceof Date);
  assert.equal(a['event.project'].title, 'Smart pot');
  assert.equal(a['event.submission'].fileName, 'a.pdf');
  assert.equal(a.team, 'Volts');
  assert.ok(a.feedback.overall === 5);
  assert.equal('event.evaluation' in a, false);

  const b = mergeProgress({ event: { registeredAt: new Date(), submission: { filePath: '/uploads/x/file.pdf', fileName: 'real.pdf' } }, feedback: { overall: 3 } }, snap);
  assert.equal('event.submission' in b, false);                                // real upload kept
  assert.equal('event.registeredAt' in b, false);
  assert.equal('feedback' in b, false);                                        // existing feedback kept
});

test('progressOf returns the evaluation made by the admin', () => {
  const p = progressOf({ name: 'A', school: 'S', className: '8', learnedTopics: [{ topicId: 3 }], sims: [{ simId: 'q' }],
    event: { evaluation: { scores: [1], total: 80, remark: 'good', award: 'Finalist', certId: 'C1', at: new Date() } } });
  assert.equal(p.evaluation.total, 80);
  assert.equal(p.cert_id, 'C1');
  assert.deepEqual(p.learned_topics, [3]);
  assert.equal(progressOf({ name: 'A', school: 'S', className: '8' }).evaluation, null);
});

test('quiz bank: exactly 25 different questions in each of the three levels', () => {
  const { questions, levels } = quizBank();
  assert.deepEqual(Object.keys(levels), ['beginner', 'intermediate', 'advanced']);
  const all = Object.values(levels).flatMap((l) => l.indices);
  for (const l of Object.values(levels)) assert.equal(l.indices.length, 25);
  assert.equal(new Set(all).size, 75);                                          // no question is used twice
  for (const i of all) { const q = questions[i]; assert.ok(q && q.q && q.why); assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4); assert.ok(q.answer >= 0 && q.answer < 4); }
  assert.equal(Math.round((15 / 25) * 100) >= 60, true);                        // 15 of 25 correct = 60% = pass
  assert.equal(Math.round((14 / 25) * 100) >= 60, false);
});

test('sync keeps learned 3D kit components (union, never removed)', () => {
  const server = { learnedComponents: [{ componentId: 'uno', at: new Date() }] };
  assert.deepEqual(mergeProgress(server, {}).learnedComponents.map((x) => x.componentId), ['uno']);
  const m = mergeProgress(server, { learned_components: ['lcd', 'uno', 'relay'] });
  assert.deepEqual(m.learnedComponents.map((x) => x.componentId).sort(), ['lcd', 'relay', 'uno']);
  assert.deepEqual(progressOf({ name: 'A', school: 'S', className: '8', learnedComponents: m.learnedComponents }).learned_components.sort(), ['lcd', 'relay', 'uno']);
});
