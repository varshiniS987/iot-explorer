// API client. Set  VITE_API_URL=http://localhost:8000  in frontend/.env
import type { AdminStats, CertificateRow, EventConfig, FeedbackSummary, StudentDetail, StudentList, SubmissionRow } from '../types/admin';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';
const STUDENT_KEY = 'iot-explorer-token';
const ADMIN_KEY = 'iot-explorer-admin-token';

export const getToken = () => localStorage.getItem(STUDENT_KEY);
export const setToken = (t: string) => localStorage.setItem(STUDENT_KEY, t);
export const clearToken = () => localStorage.removeItem(STUDENT_KEY);
export const getAdminToken = () => localStorage.getItem(ADMIN_KEY);
export const setAdminToken = (t: string) => localStorage.setItem(ADMIN_KEY, t);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type Who = 'student' | 'admin';

/** Tells the session store that a token was rejected (expired, replaced by a newer login, ...). */
const expired = (who: Who) => window.dispatchEvent(new CustomEvent('iot-auth-expired', { detail: who }));

async function request(path: string, init: RequestInit, who: Who): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = who === 'admin' ? getAdminToken() : getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  let res: Response;
  try { res = await fetch(`${BASE}${path}`, { ...init, headers }); }
  catch { throw new ApiError(0, 'Cannot reach the server. Please check your internet connection and try again in a minute (a free server may need a moment to wake up).'); }
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))).detail as string | undefined;
    if (res.status === 401 && token) { if (who === 'admin') clearAdminToken(); else clearToken(); expired(who); }
    throw new ApiError(res.status, detail ?? `Request failed (${res.status})`);
  }
  return res;
}
async function call<T>(path: string, init: RequestInit = {}, who: Who = 'student'): Promise<T> {
  const res = await request(path, init, who);
  return res.status === 204 ? (undefined as T) : res.json();
}
async function download(path: string, filename: string, who: Who) {
  const blob = await (await request(path, {}, who)).blob();
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const qs = (o: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();

export type Videos = Record<'tamil' | 'english', { label: string; channel: string; query: string; url: string }>;
export interface Brief { id: string; name: string; email: string; school: string; class_name: string; city: string }
export interface ServerProgress {
  profile: { name: string; school: string; class_name: string };
  learned_topics: number[];
  topic_results: { topic_id: number; score: number; total: number; passed: boolean; date: string }[];
  sims: string[];
  learned_components: string[];
  certificate_id: string | null;
  game_best: { level: string; score: number; stars: number }[];
  games_won: number; quiz_level: 'beginner' | 'intermediate' | 'advanced';
  evaluation: { scores: number[]; total: number; remark: string; award: string; at: string } | null;
  cert_id: string | null;
}

export const api = {
  topicVideos: (id: number) => call<{ videos: Videos }>(`/api/topics/${id}/videos`),
  allVideos: () => call<{ id: number; title: string; videos: Videos }[]>('/api/videos'),
  progress: () => call('/api/me/progress'),
  completeSim: (simId: string) => call(`/api/me/sims/${encodeURIComponent(simId)}`, { method: 'PUT' }),
  markLearned: (id: number) => call(`/api/me/topics/${id}/learned`, { method: 'POST' }),
  topicQuiz: (id: number) => call(`/api/topics/${id}/quiz`),
  gradeTopicQuiz: (id: number, answers: string[]) => call(`/api/topics/${id}/quiz`, { method: 'POST', body: JSON.stringify({ answers }) }),

  // ---- student account
  register: async (b: { name: string; email: string; school: string; class_name: string; city?: string; parent_email?: string; password: string }) => {
    const r = await call<{ student_id: string; token: string }>('/api/students', { method: 'POST', body: JSON.stringify(b) });
    setToken(r.token); return r;
  },
  studentLogin: async (email: string, password: string) => {
    const r = await call<{ token: string; student: Brief }>('/api/auth/student/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(r.token); return r;
  },
  me: () => call<Brief & { parent_email: string }>('/api/me'),
  sync: (snapshot: unknown) => call<ServerProgress>('/api/me/sync', { method: 'PUT', body: JSON.stringify(snapshot) }),

  // ---- admin
  adminLogin: async (email: string, password: string) => {
    const r = await call<{ token: string; admin: { email: string } }>('/api/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }, 'admin');
    setAdminToken(r.token); return r;
  },
  adminMe: () => call<{ email: string; role: string }>('/api/auth/admin/me', {}, 'admin'),
  adminStats: () => call<AdminStats>('/api/admin/stats', {}, 'admin'),
  adminStudents: (p: { search?: string; class_name?: string; page?: number; limit?: number }) => call<StudentList>(`/api/admin/students?${qs(p)}`, {}, 'admin'),
  adminStudent: (id: string) => call<StudentDetail>(`/api/admin/students/${id}`, {}, 'admin'),
  adminDeleteStudent: (id: string) => call<void>(`/api/admin/students/${id}`, { method: 'DELETE' }, 'admin'),
  adminCertificates: () => call<CertificateRow[]>('/api/admin/certificates', {}, 'admin'),
  adminSubmissions: () => call<SubmissionRow[]>('/api/events/admin/submissions', {}, 'admin'),
  adminEvaluate: (id: string, body: { scores: number[]; remark: string; award: string }) =>
    call<{ total: number; award: string; certificate_id: string }>(`/api/events/admin/evaluate/${id}`, { method: 'POST', body: JSON.stringify(body) }, 'admin'),
  adminFeedback: () => call<FeedbackSummary>('/api/feedback/admin/all', {}, 'admin'),
  eventConfig: () => call<EventConfig>('/api/events/config', {}, 'admin'),
  downloadStudentsCsv: () => download('/api/admin/export/students.csv', 'students.csv', 'admin'),
  downloadSubmission: (id: string, name: string) => download(`/api/events/admin/submissions/${id}/file`, name, 'admin'),
};