import { Play, Square, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export default function SimulationControls({ project, sim, canRun = true, muted, onMute, extra }) {
  const { values, setParam, running, start, stop, reset } = sim;
  return (
    <div className="panel">
      <h3>Controls</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <button className="sim-btn sim-btn-primary" onClick={start} disabled={running || !canRun}><Play size={15} />Start</button>
        <button className="sim-btn" onClick={stop} disabled={!running}><Square size={15} />Stop</button>
        <button className="sim-btn" onClick={reset}><RotateCcw size={15} />Reset</button>
        <button className="sim-btn" onClick={onMute} aria-pressed={muted}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}{muted ? 'Sound off' : 'Sound on'}</button>
        {extra}
      </div>
      {!running && <p className="muted" style={{ marginTop: 0 }}>{canRun ? 'Press Start to run the circuit.' : 'The circuit must be complete before it can run.'}</p>}
      <div className="grid gap-3">
        {project.params.map((q) => (
          <label key={q.k} className="block text-sm">
            {q.type === 'toggle' ? (
              <span className="flex items-center gap-2"><input type="checkbox" checked={!!values[q.k]} onChange={(e) => setParam(q.k, e.target.checked)} />{q.label}</span>
            ) : q.type === 'select' ? (
              <span className="flex items-center gap-2">{q.label}
                <select value={values[q.k]} onChange={(e) => setParam(q.k, +e.target.value)}>{q.options.map((o, i) => <option key={o} value={i}>{o}</option>)}</select></span>
            ) : (<>
              <span className="flex justify-between"><span>{q.label}</span><b style={{ color: 'var(--cy)' }}>{values[q.k]} {q.unit}</b></span>
              <input type="range" min={q.min} max={q.max} step={q.step} value={values[q.k]} onChange={(e) => setParam(q.k, +e.target.value)} aria-label={q.label} />
            </>)}
          </label>
        ))}
      </div>
    </div>
  );
}
