import { CheckCircle2, XCircle } from 'lucide-react';
export default function ResultPanel({ result }) {
  if (!result) return null;
  const { wiring, tests, passed } = result;
  return (
    <div className="panel" style={{ borderColor: passed ? '#10b981' : '#ef4444' }} role="status">
      <h3 style={{ color: passed ? '#6ee7b7' : '#fca5a5' }}>{passed ? 'Wiring is correct. Now press Start, then Stop to complete the project.' : 'Wiring needs fixing'}</h3>
      <p className="muted" style={{ marginTop: 0 }}>Wiring: {wiring.satisfied}/{wiring.total} connections correct · accuracy {wiring.accuracy}%</p>
      {wiring.errors.length > 0 && <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>{wiring.errors.map((e) => <li key={e} className="bad-t" style={{ fontSize: 13 }}>{e}</li>)}</ul>}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {tests.map((t) => (
          <li key={t.name} className="flex items-center gap-2" style={{ fontSize: 13 }}>
            {t.pass ? <CheckCircle2 size={14} color="#34d399" /> : <XCircle size={14} color="#f87171" />}{t.name}<span className="muted">— {t.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}