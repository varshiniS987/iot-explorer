import { api } from '../../services/api';
import { ErrorBox, Loading, Panel, Stat, fmtDate, useAsync } from './ui';

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));

export default function AdminFeedback() {
  const { data, error, loading, reload } = useAsync(() => api.adminFeedback());
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return loading ? <Loading /> : null;
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold">Feedback</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Responses" value={data.count} />
        <Stat label="Overall" value={data.count ? data.average.overall : '-'} hint="out of 5" />
        <Stat label="Usability" value={data.count ? data.average.usability : '-'} hint="out of 5" />
        <Stat label="Learning" value={data.count ? data.average.learning : '-'} hint="out of 5" />
      </div>
      <Panel title="Student comments">
        {data.items.length === 0 ? <p className="text-sm text-slate-300">No feedback yet. Students can send it after finishing a quiz.</p> : (
          <ul className="grid gap-3">
            {data.items.map((f, i) => (
              <li key={i} className="rounded-xl bg-white/5 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2"><b>{f.name} <span className="font-normal text-slate-300">· {f.school}, class {f.cls}</span></b><span className="text-amber-200" title="Overall rating">{stars(f.overall)}</span></div>
                <div className="mt-1 text-slate-300">Usability {f.usability}/5 · Learning {f.learning}/5 · Favourite: {f.favorite} · {fmtDate(f.at)}</div>
                {f.suggestions && <p className="mt-1">“{f.suggestions}”</p>}
              </li>))}
          </ul>)}
      </Panel>
    </div>
  );
}
