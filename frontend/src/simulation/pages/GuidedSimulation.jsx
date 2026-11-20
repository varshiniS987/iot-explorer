import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { getProject } from '../projects/index.js';
import CircuitBoard from '../components/CircuitBoard.jsx';
import ComponentPanel from '../components/ComponentPanel.jsx';
import CodeViewer from '../components/CodeViewer.jsx';
import SimulationControls from '../components/SimulationControls.jsx';
import SimView from '../components/SimView.jsx';
import { useSimulation } from '../utils/useSimulation.js';
import { pinLabel, wireColor } from '../utils/partDefs.js';
import { saveProgress } from '../utils/progressStorage.js';
import { useSim } from '../utils/simContext.js';

function Guided({ project }) {
  const nav = useNavigate();
  const { basePath } = useSim();
  const sim = useSimulation(project);
  const [step, setStep] = useState(0);
  const [muted, setMuted] = useState(false);
  const total = project.wires.length;
  const shown = project.wires.slice(0, step);
  const text = step === 0 ? 'The parts are placed. Look at the components, then press Next to add the first wire.' : `Connect ${pinLabel(project, project.wires[step - 1][0])} to ${pinLabel(project, project.wires[step - 1][1])}.`;
  const ready = step === total;
  const finish = () => { saveProgress(project, { guidedCompleted: true }); nav(`${basePath}/independent/${project.id}`); };
  return (
    <main className="sim-wrap">
      <Link to={basePath} className="sim-btn" style={{ marginBottom: 12 }}><ArrowLeft size={15} />Projects</Link>
      <h1 style={{ fontSize: 24, margin: '6px 0' }}>{project.name} <span className={`badge b-${project.difficulty}`}>{project.difficulty}</span></h1>
      <p className="muted" style={{ marginTop: 0 }}><b>Goal:</b> {project.objective}</p>
      <div style={{ height: 8, borderRadius: 8, background: '#16214d', overflow: 'hidden', margin: '8px 0 14px' }} role="progressbar" aria-valuenow={Math.round((step / total) * 100)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${(step / total) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#22d3ee,#8b5cf6)', transition: 'width .3s' }} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4" style={{ alignContent: 'start' }}>
          <div className="panel">
            <CircuitBoard project={project} wires={shown} animateLast={step > 0} live={sim.ran ? project.live(sim.out) : {}} />
            <div className="mt-3 p-3" style={{ background: '#0d1536', borderRadius: 10 }} aria-live="polite">
              <b style={{ color: 'var(--cy)' }}>Step {step} of {total}</b>
              <p style={{ margin: '4px 0 0' }}>{text}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="sim-btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ChevronLeft size={15} />Previous</button>
              <button className="sim-btn sim-btn-primary" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={ready}>Next<ChevronRight size={15} /></button>
            </div>
          </div>
          <div className="panel"><h3>All connections</h3>
            <ol style={{ margin: 0, paddingLeft: 20 }}>{project.wires.map(([a, b], i) => (
              <li key={i} className="muted" style={{ opacity: i < step ? 1 : 0.45 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: wireColor(a, b, i), marginRight: 6 }} />{pinLabel(project, a)} → {pinLabel(project, b)}
              </li>))}</ol>
          </div>
          <ComponentPanel project={project} />
        </div>
        <div className="grid gap-4" style={{ alignContent: 'start' }}>
          <SimView project={project} sim={sim} muted={muted} />
          <SimulationControls project={project} sim={sim} canRun={ready} muted={muted} onMute={() => setMuted((m) => !m)} />
          <div className="panel">
            <p className="muted" style={{ marginTop: 0 }}>{!ready ? 'Finish all wiring steps first.' : !sim.ran ? 'Wiring done. Press Start and try the controls.' : 'Great! You can now try it yourself.'}</p>
            <button className="sim-btn sim-btn-ok" disabled={!ready || !sim.ran} onClick={finish}><Flag size={15} />Complete guided part · start independent practice</button>
          </div>
          <CodeViewer project={project} />
        </div>
      </div>
    </main>
  );
}

export default function GuidedSimulation() {
  const { id } = useParams();
  const { basePath } = useSim();
  const project = getProject(id);
  if (!project) return <main className="sim-wrap"><p>Project not found.</p><Link className="sim-btn" to={basePath}>Back to projects</Link></main>;
  return <Guided key={id} project={project} />;
}
