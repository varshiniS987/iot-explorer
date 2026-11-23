import { api } from '../../services/api';
import { Badge, ErrorBox, Loading, Panel, fmtDate, td, th, useAsync } from './ui';

export default function AdminCertificates() {
  const { data, error, loading, reload } = useAsync(() => api.adminCertificates());
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return loading ? <Loading /> : null;
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-extrabold">Certificates</h1>
      <Panel title={`${data.length} issued`}>
        {data.length === 0 ? <p className="py-6 text-center text-slate-300">No certificate has been issued yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead><tr className="border-b border-white/15"><th className={th}>Certificate ID</th><th className={th}>Student</th><th className={th}>Title</th><th className={th}>Type</th><th className={th}>Score</th><th className={th}>Issued</th></tr></thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.cert_id} className="border-b border-white/10">
                    <td className={`${td} font-mono text-xs`}>{c.cert_id}</td>
                    <td className={td}>{c.student ? <><b>{c.student.name}</b><div className="text-xs text-slate-300">{c.student.school} · class {c.student.class_name}</div></> : <span className="text-slate-300">deleted student</span>}</td>
                    <td className={td}>{c.title}</td><td className={td}><Badge tone={c.kind === 'event' ? 'amber' : 'blue'}>{c.kind}</Badge></td>
                    <td className={td}>{c.score ?? '-'}</td><td className={td}>{fmtDate(c.created_at)}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </Panel>
    </div>
  );
}
