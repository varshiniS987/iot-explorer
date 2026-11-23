import { PROJECTS } from '../../simulation/projects/index.js';
import { api } from '../../services/api';
import { Bars, ErrorBox, Loading, Panel, Stat, fmtDate, useAsync } from './ui';

const SIM_NAME = Object.fromEntries(PROJECTS.map((p) => [p.id, p.name]));

export default function AdminOverview() {
  const { data, error, loading, reload } = useAsync(() => api.adminStats());
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return loading ? <Loading /> : null;
  const { totals: t, learning: l } = data;
  const maxDay = Math.max(1, ...data.signups.map((d) => d.count));

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold">Overview</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Students" value={t.students} hint={`${t.new_7d} new in 7 days`} />
        <Stat label="Event sign-ups" value={t.event_registered} />
        <Stat label="Submitted" value={t.submitted} />
        <Stat label="Evaluated" value={t.evaluated} />
        <Stat label="Certificates" value={t.certificates} />
        <Stat label="Feedback" value={t.feedback} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Learning">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-300">Avg topics learned</dt><dd className="text-2xl font-extrabold">{l.avg_topics_learned} <small className="text-sm font-semibold text-slate-300">/ {l.total_topics}</small></dd></div>
            <div><dt className="text-slate-300">Finished all topics</dt><dd className="text-2xl font-extrabold">{l.course_completed}</dd></div>
            <div><dt className="text-slate-300">Quiz attempts</dt><dd className="text-2xl font-extrabold">{l.quiz_attempts} <small className="text-sm font-semibold text-slate-300">({l.quiz_pass_rate}% passed)</small></dd></div>
            <div><dt className="text-slate-300">Simulations completed</dt><dd className="text-2xl font-extrabold">{l.sims_completed}</dd></div>
          </dl>
        </Panel>
        <Panel title="New students, last 14 days">
          <div className="flex h-32 items-end gap-1" role="img" aria-label="Sign-ups per day">
            {data.signups.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.date}: ${d.count}`}>
                <span className="text-[10px] text-slate-300">{d.count || ''}</span>
                <span className="w-full rounded-t bg-cyan-300" style={{ height: `${Math.max(d.count ? 8 : 2, (d.count / maxDay) * 96)}px`, opacity: d.count ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-300"><span>{fmtDate(data.signups[0]?.date)}</span><span>{fmtDate(data.signups[data.signups.length - 1]?.date)}</span></div>
        </Panel>
        <Panel title="Students by class"><Bars items={data.by_class.map((c) => ({ label: `Class ${c.class_name}`, value: c.count }))} /></Panel>
        <Panel title="Top schools"><Bars items={data.by_school.map((s) => ({ label: s.school, value: s.count }))} /></Panel>
        <Panel title="Simulation projects completed" className="lg:col-span-2">
          <Bars items={data.simulations.map((s) => ({ label: SIM_NAME[s.sim_id] ?? s.sim_id, value: s.count }))} empty="No simulation has been completed yet." />
        </Panel>
      </div>

      <Panel title="Newest students">
        {data.recent.length === 0 ? <p className="text-sm text-slate-300">No students yet. Students appear here after they register or log in on the Login page.</p> : (
          <ul className="divide-y divide-white/10 text-sm">
            {data.recent.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><b>{s.name}</b> <span className="text-slate-300">· {s.school}, class {s.class_name}</span></span>
                <span className="text-slate-300">{fmtDate(s.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
