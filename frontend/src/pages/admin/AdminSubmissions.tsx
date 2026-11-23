import { useMemo, useState } from 'react';
import { Download, Gavel } from 'lucide-react';
import { api } from '../../services/api';
import type { SubmissionRow } from '../../types/admin';
import { Badge, ErrorBox, Loading, Modal, Panel, fmtDate, td, th, useAsync } from './ui';

function EvaluateModal({ row, onClose, onSaved }: { row: SubmissionRow; onClose: () => void; onSaved: () => void }) {
  const cfg = useAsync(() => api.eventConfig(), []);
  const rubric = cfg.data?.rubric ?? [];
  const [scores, setScores] = useState<Record<number, number>>({});
  const [remark, setRemark] = useState('');
  const [award, setAward] = useState('Participant');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const values = rubric.map((_, i) => scores[i] ?? 0);
  const total = values.reduce((a, b) => a + b, 0);

  const save = async () => {
    setErr('');
    if (rubric.some(([, max], i) => values[i] < 0 || values[i] > max)) { setErr('A score is outside the allowed range.'); return; }
    setBusy(true);
    try { await api.adminEvaluate(row.id, { scores: values, remark: remark.trim(), award }); onSaved(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Could not save.'); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Evaluate: ${row.name}`} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-200">Project: <b>{row.title ?? '-'}</b></p>
      {cfg.error && <ErrorBox message={cfg.error} />}
      {cfg.loading && !cfg.data ? <Loading /> : (
        <div className="grid gap-3">
          {rubric.map(([name, max], i) => (
            <label key={name} className="grid grid-cols-[1fr_6rem] items-center gap-3 text-sm">
              <span>{name} <span className="text-slate-300">(0 to {max})</span></span>
              <input type="number" min={0} max={max} className="form-field !mt-0" value={scores[i] ?? 0} onChange={(e) => setScores({ ...scores, [i]: Math.round(Number(e.target.value) || 0) })} />
            </label>))}
          <p className="text-right text-lg font-extrabold">Total: {total} / 100</p>
          <label className="text-sm">Award
            <select className="form-field" value={award} onChange={(e) => setAward(e.target.value)}>{(cfg.data?.awards ?? ['Participant']).map((a) => <option key={a}>{a}</option>)}</select></label>
          <label className="text-sm">Remark for the student
            <textarea className="form-field" rows={3} maxLength={500} value={remark} onChange={(e) => setRemark(e.target.value)} /></label>
          {err && <ErrorBox message={err} />}
          <div className="flex justify-end gap-2"><button className="btn7 btn7-glass" onClick={onClose}>Cancel</button>
            <button className="btn7 btn7-sun" onClick={save} disabled={busy || !rubric.length}>{busy ? 'Saving…' : 'Save evaluation'}</button></div>
        </div>)}
    </Modal>
  );
}

export default function AdminSubmissions() {
  const { data, error, loading, reload } = useAsync(() => api.adminSubmissions());
  const [evalRow, setEvalRow] = useState<SubmissionRow | null>(null);
  const [msg, setMsg] = useState('');
  const counts = useMemo(() => ({ total: data?.length ?? 0, submitted: data?.filter((r) => r.submitted_at).length ?? 0, done: data?.filter((r) => r.total !== null).length ?? 0 }), [data]);

  const download = async (r: SubmissionRow) => {
    setMsg('');
    try { await api.downloadSubmission(r.id, r.file_name ?? 'submission'); }
    catch (e) { setMsg(`${r.name}: ${e instanceof Error ? e.message : 'download failed'} (the student may have submitted a link or only a file name).`); }
  };

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold">Event submissions</h1>
      {error ? <ErrorBox message={error} onRetry={reload} /> : !data ? (loading ? <Loading /> : null) : (
        <Panel title={`${counts.total} registered · ${counts.submitted} submitted · ${counts.done} evaluated`}>
          {msg && <div className="mb-3"><ErrorBox message={msg} /></div>}
          {data.length === 0 ? <p className="py-6 text-center text-slate-300">No student has registered for the event yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead><tr className="border-b border-white/15"><th className={th}>Student</th><th className={th}>Project</th><th className={th}>Submission</th><th className={th}>Result</th><th className={th}>Actions</th></tr></thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.id} className="border-b border-white/10">
                      <td className={td}><b>{r.name}</b><div className="text-xs text-slate-300">{r.school} · class {r.class_name}{r.team ? ` · team ${r.team}` : ''}</div></td>
                      <td className={td}>{r.title ?? <span className="text-slate-300">not chosen</span>}</td>
                      <td className={td}>{r.submitted_at ? <span>{r.file_name || 'link'}{r.link && <> · <a className="underline" href={r.link} target="_blank" rel="noopener noreferrer">open link</a></>}<div className="text-xs text-slate-300">{fmtDate(r.submitted_at)}</div></span> : <Badge>Waiting</Badge>}</td>
                      <td className={td}>{r.total !== null ? <span><b>{r.total}</b> / 100 <Badge tone="green">{r.award}</Badge></span> : <Badge tone="amber">Not evaluated</Badge>}</td>
                      <td className={td}><div className="flex flex-wrap gap-2">
                        {r.file_name && <button className="btn7 btn7-glass" onClick={() => download(r)} title="Download the uploaded file"><Download size={15} /></button>}
                        <button className="btn7 btn7-sun" disabled={!r.submitted_at} onClick={() => setEvalRow(r)} title={r.submitted_at ? 'Evaluate' : 'The student has not submitted yet'}><Gavel size={15} /> {r.total !== null ? 'Re-evaluate' : 'Evaluate'}</button></div></td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </Panel>)}
      {evalRow && <EvaluateModal row={evalRow} onClose={() => setEvalRow(null)} onSaved={() => { setEvalRow(null); reload(); }} />}
    </div>
  );
}
