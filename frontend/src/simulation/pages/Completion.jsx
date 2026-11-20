import { Link, useNavigate, useParams } from 'react-router-dom';
import { PartyPopper, ArrowRight, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { getProject } from '../projects/index.js';
import { getProgress } from '../utils/progressStorage.js';
import { useSim } from '../utils/simContext.js';

export default function Completion() {
  const { id } = useParams();
  const nav = useNavigate();
  const { basePath, quizRoute, studentName, onContinueToQuiz } = useSim();
  const project = getProject(id);
  const rec = getProgress(id);
  if (!project) return <main className="sim-wrap"><p>Project not found.</p><Link className="sim-btn" to={basePath}>Back to projects</Link></main>;
  if (!rec?.validationPassed) {
    return <main className="sim-wrap"><div className="panel" style={{ maxWidth: 520 }}><h3>Not completed yet</h3>
      <p className="muted">Connect all wires correctly, press Start, then press Stop to complete this project.</p><Link className="sim-btn sim-btn-primary" to={`${basePath}/independent/${id}`}>Go to independent practice</Link></div></main>;
  }
  const toQuiz = () => { onContinueToQuiz?.(rec); nav(quizRoute.replace(':projectId', id)); };
  return (
    <main className="sim-wrap" style={{ maxWidth: 760 }}>
      <div className="panel">
        <h1 style={{ margin: 0, fontSize: 26 }}><PartyPopper style={{ display: 'inline', marginRight: 8 }} color="#facc15" />Well done, {studentName}!</h1>
        <p className="muted">{project.name}</p>
        <div className="grid gap-3 my-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          {[['Status', 'Completed'], ['Wiring checks', rec.attempts], ['Hints used', rec.hintsUsed], ['Connection accuracy', `${rec.connectionAccuracy}%`], ['Completed', new Date(rec.completedAt).toLocaleString()]].map(([k, v]) => (
            <div key={k} className="panel" style={{ padding: 12 }}><div className="muted">{k}</div><div style={{ fontWeight: 800, fontSize: 18, color: 'var(--cy)' }}>{v}</div></div>))}
        </div>
        <h3>Simulation test results</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>{rec.testResults.map((t) => (
          <li key={t.name} className="flex items-center gap-2">{t.pass ? <CheckCircle2 size={15} color="#34d399" /> : <XCircle size={15} color="#f87171" />}{t.name}</li>))}</ul>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className="sim-btn sim-btn-primary" onClick={toQuiz}>Continue to Quiz<ArrowRight size={15} /></button>
          <Link className="sim-btn" to={basePath}><ArrowLeft size={15} />Back to Projects</Link>
        </div>
      </div>
    </main>
  );
}
