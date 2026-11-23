import { useEffect, useState } from 'react';
import { Download, Search, Trash2 } from 'lucide-react';
import { PROJECTS } from '../../simulation/projects/index.js';
import { api } from '../../services/api';
import type { StudentRow } from '../../types/admin';
import { Badge, ErrorBox, Loading, Modal, Panel, fmtDate, fmtDateTime, td, th, useAsync } from './ui';

const SIM_NAME = Object.fromEntries(PROJECTS.map((p) => [p.id, p.name]));
const eventBadge = (s: StudentRow) =>
  s.evaluated ? <Badge tone="green">Scored {s.total}</Badge> : s.submitted ? <Badge tone="blue">Submitted</Badge> : s.event_registered ? <Badge tone="amber">Registered</Badge> : <Badge>-</Badge>;

function StudentModal({ id, onClose, onDeleted }: { id: string; onClose: () => void; onDeleted: () => void }) {
  const { data: s, error, loading } = useAsync(() => api.adminStudent(id), [id]);
  const [msg, setMsg] = useState('');
  const remove = async () => {
    if (!s || !window.confirm(`Delete ${s.name} and all of their data? This cannot be undone.`)) return;
    try { await api.adminDeleteStudent(s.id); onDeleted(); } catch (e) { setMsg(e instanceof Error ? e.message : 'Could not delete.'); }
  };
  return (
    <Modal title={s?.name ?? 'Student'} onClose={onClose}>
      {error && <ErrorBox message={error} />}
      {loading && !s && <Loading />}
      {s && (
        <div className="grid gap-4 text-sm">
          <div className="grid gap-1 text-slate-200 sm:grid-cols-2">
            <span>E-mail: <b>{s.email}</b></span><span>School: <b>{s.school}</b></span>
            <span>Class: <b>{s.class_name}</b></span><span>City: <b>{s.city || '-'}</b></span>
            <span>Joined: <b>{fmtDate(s.created_at)}</b></span><span>Last login: <b>{fmtDateTime(s.last_login_at)}</b></span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[['Topics learned', s.topics_learned], ['Quiz attempts', s.quiz_attempts], ['Best quiz score', s.best_quiz], ['Simulations done', `${s.sims_done} / ${PROJECTS.length}`]].map(([k, v]) => (
              <div key={String(k)} className="rounded-xl bg-white/10 p-3"><div className="text-xs text-slate-300">{k}</div><div className="text-xl font-extrabold">{v}</div></div>
            ))}
          </div>
          <div><h3 className="mb-1 font-bold">Simulation projects completed</h3>
            {s.sims.length ? <div className="flex flex-wrap gap-1.5">{s.sims.map((x) => <Badge key={x.sim_id} tone="green">{SIM_NAME[x.sim_id] ?? x.sim_id}</Badge>)}</div> : <p className="text-slate-300">None yet.</p>}</div>
          <div><h3 className="mb-1 font-bold">Quiz results</h3>
            {s.quiz_results.length ? <ul className="grid gap-1">{s.quiz_results.slice(0, 8).map((q, i) => (
              <li key={i} className="flex justify-between rounded-lg bg-white/5 px-3 py-1.5"><span className="capitalize">{q.level}</span><span>{q.score} · {q.passed ? 'Passed' : 'Not passed'} · {fmtDate(q.at)}</span></li>))}</ul> : <p className="text-slate-300">No quiz taken yet.</p>}</div>
          <div><h3 className="mb-1 font-bold">Event</h3>
            {!s.event.registered_at ? <p className="text-slate-300">Not registered.</p> : (
              <ul className="grid gap-1 text-slate-200">
                <li>Registered: {fmtDate(s.event.registered_at)}</li>
                {s.event.slot && <li>Slot: {s.event.slot.date} {s.event.slot.time} ({s.event.slot.mode})</li>}
                {s.event.project && <li>Project: <b>{s.event.project.title}</b></li>}
                {s.event.submission && <li>Submission: {s.event.submission.file_name || s.event.submission.link || 'yes'} ({fmtDate(s.event.submission.at)})</li>}
                {s.event.evaluation && <li>Evaluation: <b>{s.event.evaluation.total} / 100</b> · {s.event.evaluation.award} · {s.event.evaluation.remark}</li>}
              </ul>)}</div>
          {s.feedback && <div><h3 className="mb-1 font-bold">Feedback</h3><p className="text-slate-200">Overall {s.feedback.overall}/5 · Usability {s.feedback.usability}/5 · Learning {s.feedback.learning}/5{s.feedback.suggestions ? ` · “${s.feedback.suggestions}”` : ''}</p></div>}
          {msg && <ErrorBox message={msg} />}
          <div className="flex justify-end"><button className="btn7 btn7-coral" onClick={remove}><Trash2 size={16} /> Delete student</button></div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminStudents() {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [cls, setCls] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [csvMsg, setCsvMsg] = useState('');

  useEffect(() => { const t = setTimeout(() => { setSearch(input.trim()); setPage(1); }, 300); return () => clearTimeout(t); }, [input]);
  const { data, error, loading, reload } = useAsync(() => api.adminStudents({ search, class_name: cls, page, limit: 15 }), [search, cls, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const exportCsv = async () => { setCsvMsg(''); try { await api.downloadStudentsCsv(); } catch (e) { setCsvMsg(e instanceof Error ? e.message : 'Export failed.'); } };

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold">Students</h1>
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[14rem] flex-1">
            <span className="sr-only">Search students</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input className="form-field !mt-0 !pl-9" placeholder="Search name, e-mail or school" value={input} onChange={(e) => setInput(e.target.value)} />
          </label>
          <label><span className="sr-only">Filter by class</span>
            <select className="form-field !mt-0" value={cls} onChange={(e) => { setCls(e.target.value); setPage(1); }}>
              <option value="">All classes</option>{data?.classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select></label>
          <button className="btn7 btn7-glass" onClick={exportCsv}><Download size={16} /> Export CSV</button>
        </div>
        {csvMsg && <p className="mt-2 text-sm text-rose-200">{csvMsg}</p>}
      </Panel>

      {error ? <ErrorBox message={error} onRetry={reload} /> : !data ? (loading ? <Loading /> : null) : (
        <Panel>
          {data.items.length === 0 ? <p className="py-6 text-center text-slate-300">No students found.{!search && !cls && ' Students appear here after they register or log in on the Login page.'}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-sm">
                <thead><tr className="border-b border-white/15"><th className={th}>Student</th><th className={th}>School · Class</th><th className={th}>Topics</th><th className={th}>Best quiz</th><th className={th}>Sims</th><th className={th}>Event</th><th className={th}>Joined</th></tr></thead>
                <tbody>
                  {data.items.map((s) => (
                    <tr key={s.id} className="cursor-pointer border-b border-white/10 hover:bg-white/10" onClick={() => setOpen(s.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(s.id); }}>
                      <td className={td}><b>{s.name}</b><div className="text-xs text-slate-300">{s.email}</div></td>
                      <td className={td}>{s.school} · {s.class_name}</td>
                      <td className={td}>{s.topics_learned}</td><td className={td}>{s.quiz_attempts ? s.best_quiz : '-'}</td>
                      <td className={td}>{s.sims_done} / {PROJECTS.length}</td><td className={td}>{eventBadge(s)}</td><td className={td}>{fmtDate(s.created_at)}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
          <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
            <span>{data.total} student{data.total === 1 ? '' : 's'}</span>
            <span className="flex items-center gap-2">
              <button className="btn7 btn7-glass" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              Page {page} of {pages}
              <button className="btn7 btn7-glass" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </span>
          </div>
        </Panel>)}

      {open && <StudentModal id={open} onClose={() => setOpen(null)} onDeleted={() => { setOpen(null); reload(); }} />}
    </div>
  );
}
