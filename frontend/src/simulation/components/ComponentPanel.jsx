import { Cpu } from 'lucide-react';

export default function ComponentPanel({ project, showPins = true }) {
  return (
    <div className="panel">
      <h3>Components</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {project.components.map((c) => <span key={c} className="chip" style={{ cursor: 'default' }}><Cpu size={11} style={{ display: 'inline', marginRight: 4 }} />{c}</span>)}
      </div>
      {showPins && (<>
        <table className="muted" style={{ width: '100%', fontSize: 13 }}><tbody>
          {Object.entries(project.pins).map(([k, v]) => <tr key={k}><td style={{ paddingRight: 10 }}>{k}</td><td style={{ color: '#e5ecff', fontWeight: 600 }}>{v}</td></tr>)}
        </tbody></table>
        <ul className="muted" style={{ margin: '10px 0 0', paddingLeft: 18 }}>{project.electrical.map((e) => <li key={e}>{e}</li>)}</ul>
      </>)}
    </div>
  );
}
