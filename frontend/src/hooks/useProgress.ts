import { useAppStore } from '../store/useAppStore';
import { LEARNING_TOPICS } from '../data/learningTopics';
import { PROJECTS } from '../simulation/projects/index.js';
import { KIT_COMPONENTS } from '../data/kitComponents';

export const LEVEL_TITLES = ['Spark', 'Wire Wizard', 'Circuit Maker', 'Sensor Scout', 'Robo Builder', 'IoT Hero', 'Master Inventor'];
export const LEVEL_AVATARS = ['🐣', '⚡', '🔧', '📡', '🤖', '🚀', '👑'];
export const XP_PER_LEVEL = 250;
export const GAME_LEVEL_IDS = ['easy', 'medium', 'hard'];

export interface ProgressItem { key: string; emoji: string; label: string; done: number; total: number; to: string; color: string; cta: string; text?: string }

/** One place that turns saved student data into progress numbers, XP and level. */
export function useProgress() {
  const s = useAppStore();
  const topicsPassed = Object.values(s.topicResults).filter((r) => r.passed).length;
  const gameLevels = Object.keys(s.gameBest).length;
  const quizPassed = !!s.quiz?.passed;

  const items: ProgressItem[] = [
    { key: 'sims', emoji: '🔌', label: 'Circuits wired', done: s.sims.length, total: PROJECTS.length, to: '/simulator', color: '#2de2e6', cta: 'Wire a circuit in the Lab' },
    { key: 'explored', emoji: '🧭', label: 'Parts explored in 3D', done: s.explored.length, total: KIT_COMPONENTS.length, to: '/explore', color: '#6ee7a8', cta: 'Explore a part in the 3D kit' },
    // Follows the Learning tab: a topic counts as soon as it has been viewed (see TopicCourse).
    { key: 'lessons', emoji: '📖', label: 'Component lessons', done: s.learnedTopics.length, total: LEARNING_TOPICS.length, to: '/academy', color: '#ffd23f', cta: 'Learn a topic' },
    { key: 'quiz', emoji: '🏆', label: 'Final quiz', done: quizPassed ? 1 : 0, total: 1, to: '/quiz', color: '#f9a8d4', cta: 'Take the final quiz', text: s.quiz ? `${s.quiz.score} / ${s.quiz.total}` : 'Not taken' },
    { key: 'game', emoji: '🎮', label: 'Part Match levels won', done: gameLevels, total: GAME_LEVEL_IDS.length, to: '/game', color: '#7dd3fc', cta: 'Play Part Match' },
  ];

  const fractions = items.map((i) => (i.total ? Math.min(1, i.done / i.total) : 0));
  const pct = Math.round((fractions.reduce((a, b) => a + b, 0) / items.length) * 100);

  const bestStars = Object.values(s.gameBest).reduce((a, g) => a + g.stars, 0);
  const xp = topicsPassed * 100 + s.sims.length * 80 + s.explored.length * 10 + s.lessons.length * 20 + s.experiments.length * 40 + s.challenges.length * 30 + (quizPassed ? 150 : 0) + bestStars * 25 + s.gamesWon * 10;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const idx = Math.min(level - 1, LEVEL_TITLES.length - 1);

  const next = items.filter((i) => i.done < i.total).sort((a, b) => a.done / a.total - b.done / b.total)[0] ?? null;

  return { s, items, pct, xp, level, title: LEVEL_TITLES[idx], avatar: LEVEL_AVATARS[idx], into: xp % XP_PER_LEVEL, need: XP_PER_LEVEL, next };
}