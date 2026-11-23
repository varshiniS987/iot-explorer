# Patch guide: project completes only after correct wiring + Start + Stop

All paths are inside `iot final/frontend/src/simulation/`. Line numbers refer to the files **before** the change
(the version you already have). **Because some edits insert new lines, do the edits in each file from the BOTTOM to the TOP**, otherwise the line numbers shift. For `useSimulation.js` it is safest to replace the whole file (see section 1). If you would rather not edit by hand,
the updated `iot final.zip` already contains all four files finished.

## New rule
1. Connect **all** wires correctly (Start stays locked until then).
2. Press **Start**.
3. Press **Stop** -> the project is completed and the Completion page opens.

"Check wiring" (the old Validate button) now only shows feedback. It never completes a project.
Reset does not count as Stop. Removing a wire while running cancels the run and does not complete anything.

---

## 1. `utils/useSimulation.js`  (safest: replace the WHOLE file with `utils/useSimulation.js` from the new zip)

If you edit by hand, go bottom to top: line 38, then line 28, then after line 17, then after line 10.

**After line 10** (`const [ran, setRan] = useState(false);`) add:
```js
  const [stops, setStops] = useState(0); // how many times Stop was pressed (Reset does not count)
```

**After line 17** (`    setRan(false);`) add:
```js
    setStops(0);
```

**Replace line 28** (`const stop = ...`) with:
```js
  const stop = useCallback(() => { setRunning(false); setStops((n) => n + 1); }, []);
```

**Replace line 38** (`return { values, ... }`) with:
```js
  return { values, out, running, ran, stops, setParam, start, stop, reset, hold, send };
```

---

## 2. `pages/IndependentSimulation.jsx`

**Replace line 1** with:
```js
import { useEffect, useMemo, useRef, useState } from 'react';
```

**Replace line 3** with:
```js
import { ArrowLeft, CheckCircle2, Circle, Lightbulb, Eraser, Lock } from 'lucide-react';
```

**Replace lines 17 to 76** (the whole old `function Independent({ project, record }) { ... }`, up to the `}` just above
`export default function IndependentSimulation()`) with this block:
```jsx
function Step({ done, label }) {
  return (
    <li className="flex items-center gap-2" style={{ fontSize: 14, opacity: done ? 1 : 0.7 }}>
      {done ? <CheckCircle2 size={16} color="#34d399" /> : <Circle size={16} color="#64748b" />}
      <span style={{ color: done ? '#6ee7b7' : undefined }}>{label}</span>
    </li>
  );
}

function Independent({ project, record }) {
  const nav = useNavigate();
  const { basePath } = useSim();
  const sim = useSimulation(project);
  const [wires, setWires] = useState([]);
  const [pending, setPending] = useState(null);
  const [attempts, setAttempts] = useState(record?.attempts || 0);
  const [hints, setHints] = useState(record?.hintsUsed || 0);
  const [result, setResult] = useState(null);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);
  const finished = useRef(false);
  const wiring = useMemo(() => validateWiring(project, wires), [project, wires]);
  const { running, stop, stops } = sim;

  // Removing a needed wire stops the circuit and cancels the "Start" step.
  useEffect(() => { if (!wiring.ok) { setStarted(false); if (running) stop(); } }, [wiring.ok, running, stop]);
  // Step 2: Start was pressed while every wire is correct.
  useEffect(() => { if (running && wiring.ok) setStarted(true); }, [running, wiring.ok]);

  // Step 3: Stop pressed (after Start) with every wire still correct -> project completed.
  useEffect(() => {
    if (finished.current || stops === 0 || !wiring.ok || !started) return;
    const tests = runTests(project);
    const passed = tests.every((t) => t.pass);
    const att = attempts + 1;
    setAttempts(att);
    if (!passed) { setResult({ wiring, tests, passed: false }); saveProgress(project, { attempts: att, hintsUsed: hints, connectionAccuracy: wiring.accuracy }); return; }
    finished.current = true;
    completeProject(project, { attempts: att, hintsUsed: hints, connectionAccuracy: wiring.accuracy, testResults: tests });
    nav(`${basePath}/complete/${project.id}`);
  }, [stops]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPin = (id) => {
    if (!pending) return setPending(id);
    if (pending === id) return setPending(null);
    setWires((w) => (w.some(([a, b]) => (a === pending && b === id) || (a === id && b === pending)) ? w : [...w, [pending, id]]));
    setPending(null); setResult(null);
  };
  // Feedback only: this button never completes the project.
  const checkWiring = () => {
    const w = validateWiring(project, wires);
    const tests = w.ok ? runTests(project) : [];
    const att = attempts + 1;
    setAttempts(att); setResult({ wiring: w, tests, passed: w.ok && tests.every((t) => t.pass) });
    saveProgress(project, { attempts: att, hintsUsed: hints, connectionAccuracy: w.accuracy });
  };
  const hint = () => { const n = Math.min(project.hints.length, hints + 1); if (n !== hints) { setHints(n); saveProgress(project, { hintsUsed: n }); } };

  return (
    <main className="sim-wrap">
      <Link to={basePath} className="sim-btn" style={{ marginBottom: 12 }}><ArrowLeft size={15} />Projects</Link>
      <h1 style={{ fontSize: 24, margin: '6px 0' }}>Independent practice: {project.name}</h1>
      <p className="muted" style={{ marginTop: 0 }}>{project.practice}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-4" style={{ alignContent: 'start' }}>
          <div className="panel">
            <CircuitBoard project={project} wires={wires} interactive pending={pending} onPinClick={onPin} onWireClick={(i) => { setWires((w) => w.filter((_, k) => k !== i)); setResult(null); }} live={sim.ran && wiring.ok ? project.live(sim.out) : {}} />
            <div className="flex flex-wrap gap-2 mt-3">
              <button className="sim-btn sim-btn-ok" onClick={checkWiring}><CheckCircle2 size={15} />Check wiring</button>
              <button className="sim-btn sim-btn-warn" onClick={hint} disabled={hints >= project.hints.length}><Lightbulb size={15} />Hint ({hints}/{project.hints.length})</button>
              <button className="sim-btn" onClick={() => { setWires([]); setPending(null); setResult(null); }}><Eraser size={15} />Clear wires</button>
            </div>
            <p className="muted" style={{ marginBottom: 0 }}>Wires placed: {wires.length} · Wiring checks: {attempts} · Hints used: {hints}</p>
          </div>
          <div className="panel" aria-live="polite">
            <h3>To complete this project</h3>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
              <Step done={wiring.ok} label={`1. Connect all wires correctly (${wiring.satisfied}/${wiring.total})`} />
              <Step done={started} label="2. Press Start and watch the circuit run" />
              <Step done={false} label="3. Press Stop. The project is then completed" />
            </ol>
          </div>
          <ResultPanel result={result} />
          <HintPanel hints={project.hints} used={hints} />
          <ComponentPanel project={project} showPins={false} />
        </div>
        <div className="grid gap-4" style={{ alignContent: 'start' }}>
          <SimView project={project} sim={sim} muted={muted} />
          <SimulationControls project={project} sim={sim} canRun={wiring.ok} muted={muted} onMute={() => setMuted((m) => !m)} />
          {!wiring.ok && <p className="muted">Start is locked until every wire is connected correctly. Use Check wiring to see what needs fixing.</p>}
          {wiring.ok && !started && <p className="muted">All wires are correct. Press <b>Start</b>, then <b>Stop</b> to complete the project.</p>}
          {wiring.ok && started && <p className="muted">Running. Press <b>Stop</b> when you are ready to finish.</p>}
        </div>
      </div>
    </main>
  );
}
```
Keep the blank line and `export default function IndependentSimulation()` that follow it unchanged.

---

## 3. `components/ResultPanel.jsx`

**Replace line 7** with:
```jsx
      <h3 style={{ color: passed ? '#6ee7b7' : '#fca5a5' }}>{passed ? 'Wiring is correct. Now press Start, then Stop to complete the project.' : 'Wiring needs fixing'}</h3>
```

---

## 4. `pages/Completion.jsx`

**Line 16:** change the text `This project needs a passing validation first.` to
`Connect all wires correctly, press Start, then press Stop to complete this project.`

**Line 25:** change `['Validation attempts', rec.attempts]` to `['Wiring checks', rec.attempts]`.

---

After saving, the Vite dev server reloads by itself. If the old page is open, refresh it once.
