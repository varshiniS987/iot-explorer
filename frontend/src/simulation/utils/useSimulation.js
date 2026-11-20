import { useCallback, useEffect, useRef, useState } from 'react';
import { createSim, stepSim, defaultParams } from './simulationEngine.js';

export function useSimulation(project) {
  const ref = useRef(null);
  if (!ref.current) ref.current = createSim(project);
  const [values, setValues] = useState(() => defaultParams(project));
  const [out, setOut] = useState(() => stepSim(ref.current, 0));
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);
  const [stops, setStops] = useState(0); // how many times Stop was pressed (Reset does not count)

  useEffect(() => {
    ref.current = createSim(project);
    setValues(defaultParams(project));
    setOut(stepSim(ref.current, 0));
    setRunning(false);
    setRan(false);
    setStops(0);
  }, [project]);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setOut(stepSim(ref.current, 50)), 50);
    return () => clearInterval(id);
  }, [running]);

  const setParam = useCallback((k, v) => { ref.current.p[k] = v; setValues((s) => ({ ...s, [k]: v })); }, []);
  const start = useCallback(() => { ref.current.inp.ev = []; setRunning(true); setRan(true); }, []);
  const stop = useCallback(() => { setRunning(false); setStops((n) => n + 1); }, []);
  const reset = useCallback(() => {
    const p = { ...ref.current.p };
    ref.current = createSim(project);
    ref.current.p = p;
    setOut(stepSim(ref.current, 0));
    setRunning(false);
  }, [project]);
  const hold = useCallback((k, down) => { ref.current.inp.held[k] = down; }, []);
  const send = useCallback((e) => { ref.current.inp.ev.push(e); }, []);
  return { values, out, running, ran, stops, setParam, start, stop, reset, hold, send };
}

// Web Audio buzzer: a square-wave oscillator that is gated on/off.
export function useBuzzer(on, freq = 2000, enabled = true) {
  const a = useRef(null);
  useEffect(() => {
    if (!on || !enabled) { if (a.current) a.current.g.gain.value = 0; return; }
    try {
      if (!a.current) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = 'square'; g.gain.value = 0; osc.connect(g); g.connect(ctx.destination); osc.start();
        a.current = { ctx, osc, g };
      }
      a.current.ctx.resume?.();
      a.current.osc.frequency.value = freq;
      a.current.g.gain.value = 0.04;
    } catch { /* audio unavailable */ }
  }, [on, freq, enabled]);
  useEffect(() => () => { try { a.current?.ctx.close(); } catch { /* ignore */ } a.current = null; }, []);
}
