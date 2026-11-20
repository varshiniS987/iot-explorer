import { Lightbulb } from 'lucide-react';
export default function HintPanel({ hints, used }) {
  if (!used) return null;
  return (
    <div className="panel" style={{ borderColor: '#facc15' }} role="status">
      <h3 style={{ color: '#facc15' }}><Lightbulb size={14} style={{ display: 'inline' }} /> Hints</h3>
      <ol style={{ margin: 0, paddingLeft: 18 }}>{hints.slice(0, used).map((h) => <li key={h} className="muted">{h}</li>)}</ol>
    </div>
  );
}
