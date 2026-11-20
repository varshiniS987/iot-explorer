// Copy to  src/services/api.ts  in the React project.
// Add to .env:  VITE_API_URL=http://localhost:8000
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';
const KEY = 'iot-explorer-token';

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t: string) => localStorage.setItem(KEY, t);

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? `Request failed (${res.status})`);
  return res.status === 204 ? (undefined as T) : res.json();
}

export type Videos = Record<'tamil' | 'english', { label: string; channel: string; query: string; url: string }>;

export const api = {
  topicVideos: (id: number) => call<{ videos: Videos }>(`/api/topics/${id}/videos`),
  allVideos: () => call<{ id: number; title: string; videos: Videos }[]>('/api/videos'),
  register: async (b: { name: string; email: string; school: string; class_name: string; city?: string; parent_email?: string }) => {
    const r = await call<{ student_id: string; token: string }>('/api/students', { method: 'POST', body: JSON.stringify(b) });
    setToken(r.token); return r;
  },
  progress: () => call('/api/me/progress'),
  completeSim: (simId: string) => call(`/api/me/sims/${encodeURIComponent(simId)}`, { method: 'PUT' }),
  markLearned: (id: number) => call(`/api/me/topics/${id}/learned`, { method: 'POST' }),
  topicQuiz: (id: number) => call(`/api/topics/${id}/quiz`),
  gradeTopicQuiz: (id: number, answers: string[]) => call(`/api/topics/${id}/quiz`, { method: 'POST', body: JSON.stringify({ answers }) }),
};
