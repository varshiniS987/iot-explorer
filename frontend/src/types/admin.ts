export interface StudentRow {
  id: string; name: string; email: string; school: string; class_name: string; city: string; team: string;
  created_at: string; last_login_at: string | null;
  topics_learned: number; quiz_attempts: number; best_quiz: number; sims_done: number; games_won: number;
  event_registered: boolean; submitted: boolean; evaluated: boolean; total: number | null; award: string | null;
}
export interface StudentDetail extends StudentRow {
  parent_email: string; quiz_level: string; learned_topics: number[];
  topic_results: { topic_id: number; score: number; total: number; passed: boolean; at: string }[];
  quiz_results: { level: string; score: number; passed: boolean; at: string }[];
  sims: { sim_id: string; at: string }[];
  game_best: { level: string; score: number; stars: number }[];
  feedback: { overall: number; usability: number; learning: number; favorite: string; suggestions: string } | null;
  event: {
    registered_at: string | null; slot: { date: string; time: string; mode: string } | null;
    project: { title: string; problem: string; description: string } | null;
    submission: { file_name: string; link: string; at: string } | null;
    evaluation: { scores: number[]; total: number; remark: string; award: string; cert_id: string; at: string } | null;
  };
}
export interface StudentList { total: number; page: number; limit: number; classes: string[]; items: StudentRow[] }
export interface AdminStats {
  totals: { students: number; new_7d: number; event_registered: number; submitted: number; evaluated: number; certificates: number; feedback: number };
  learning: { total_topics: number; avg_topics_learned: number; course_completed: number; quiz_attempts: number; quiz_pass_rate: number; sims_completed: number; games_won: number };
  by_class: { class_name: string; count: number }[];
  by_school: { school: string; count: number }[];
  simulations: { sim_id: string; count: number }[];
  signups: { date: string; count: number }[];
  recent: StudentRow[];
}
export interface SubmissionRow {
  id: string; name: string; email: string; school: string; class_name: string; team: string;
  title: string | null; problem: string | null; topics: number[];
  file_name: string | null; link: string | null; submitted_at: string | null; total: number | null; award: string | null;
}
export interface EventConfig { rubric: [string, number][]; awards: string[]; pass_score: number }
export interface FeedbackSummary {
  count: number; average: { overall: number; usability: number; learning: number };
  items: { name: string; cls: string; school: string; overall: number; usability: number; learning: number; favorite: string; suggestions: string; at: string }[];
}
export interface CertificateRow {
  cert_id: string; kind: string; title: string; score: number | null; created_at: string;
  student: { name: string; email: string; school: string; class_name: string } | null;
}
