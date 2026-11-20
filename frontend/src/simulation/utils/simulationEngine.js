// Pure JavaScript model of each Arduino program's behaviour (no React here, so it can be tested in Node).
// This is NOT an Arduino compiler: each behaviour mirrors the C++ shown in the code viewer.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const B = {};

export const PATTERNS = [
  { n: 'Single beep', s: [[2000, 150], [0, 850]] },
  { n: 'Triple beep', s: [[2000, 120], [0, 120], [2000, 120], [0, 120], [2000, 120], [0, 700]] },
  { n: 'Rising tones', s: [[400, 200], [600, 200], [800, 200], [1000, 200], [0, 600]] },
  { n: 'Doorbell', s: [[880, 300], [660, 500], [0, 700]] },
];
export const MENU_ITEMS = ['Temperature', 'Humidity', 'Light', 'About'];

const echoOf = (d) => (d > 400 ? 0 : Math.round((d * 2) / 0.0343));
const readCm = (echo) => (echo ? Math.round(((echo * 0.0343) / 2) * 10) / 10 : null);
const lm35 = (t) => { const adc = Math.round((t * 10 * 1023) / 5000); return { adc, reading: Math.round(((adc * 5000) / 1023 / 10) * 10) / 10 }; };

B.ultra = { init: () => ({}), tick: (s, p) => { const echo = echoOf(p.dist); return { echo, reading: readCm(echo) }; } };

B.parking = {
  init: () => ({}),
  tick: (s, p) => {
    const echo = echoOf(p.dist), reading = readCm(echo), cm = reading ?? 999;
    const zone = cm > 100 ? 'safe' : cm > 50 ? 'caution' : cm > 20 ? 'warning' : 'stop';
    const per = { caution: 800, warning: 300 }[zone];
    const buzz = zone === 'stop' ? true : per ? s.t % per < 120 : false;
    return { reading, zone, buzz, freq: zone === 'stop' ? 2500 : 2000 };
  },
};

B.lamp = {
  init: () => ({}),
  tick: (s, p) => { const adc = Math.round(p.light * 10.23); return { adc, lamp: adc < p.thr * 10.23, volts: +((adc * 5) / 1023).toFixed(2) }; },
};

B.ir = {
  init: () => ({ objs: [], n: 0, prev: false, since: 0 }),
  tick: (s, p, dt, inp) => {
    for (const e of inp.ev) { if (e === 'obj') s.objs.push({ x: -8, w: 8 }); if (e === 'long') s.objs.push({ x: -30, w: 30 }); }
    if (p.auto) { s.since += dt; if (s.since >= p.gap * 1000) { s.since = 0; s.objs.push({ x: -8, w: 8 }); } }
    s.objs.forEach((o) => { o.x += (p.speed * dt) / 1000; });
    s.objs = s.objs.filter((o) => o.x - o.w / 2 < 115);
    const det = s.objs.some((o) => Math.abs(o.x - 50) < o.w / 2 + 3);
    if (det && !s.prev) s.n++; // count only the moment an object arrives
    s.prev = det;
    return { count: s.n, detected: det, pin: det ? 0 : 1, objs: s.objs.map((o) => ({ ...o })) };
  },
};

B.door = {
  init: () => ({ openMs: 0 }),
  tick: (s, p, dt) => {
    s.openMs = p.open ? s.openMs + dt : 0;
    const alarm = !!(p.armed && p.open && s.openMs >= p.delay * 1000);
    return { open: p.open, pin: p.open ? 1 : 0, alarm, buzz: alarm && s.t % 400 < 200, freq: 1800, openMs: s.openMs };
  },
};

B.temp = { init: () => ({}), tick: (s, p) => ({ ...lm35(p.temp), mv: Math.round(p.temp * 10) }) };

B.hum = {
  init: () => ({ last: -1e9, hum: 0, temp: 0 }),
  tick: (s, p) => {
    if (s.t - s.last >= 2000) { s.last = s.t; s.hum = Math.round(p.hum); s.temp = Math.round(p.temp); } // DHT11: one reading per 2 s
    return { hum: s.hum, temp: s.temp, next: Math.max(0, Math.ceil((2000 - (s.t - s.last)) / 1000)) };
  },
};

B.tempalarm = {
  init: () => ({ alarm: false }),
  tick: (s, p) => {
    if (p.temp > p.thr) s.alarm = true; else if (p.temp <= p.thr - 1) s.alarm = false; // 1 °C hysteresis
    return { ...lm35(p.temp), alarm: s.alarm, buzz: s.alarm && s.t % 500 < 250, freq: 2200 };
  },
};

B.soil = {
  init: () => ({}),
  tick: (s, p) => {
    const adc = Math.round(1023 - p.moist * 7.23);
    const pct = clamp(Math.round((1023 - adc) / 7.23), 0, 100);
    const status = pct < 30 ? 'Dry' : pct < 60 ? 'Moist' : 'Wet';
    return { adc, pct, status, lines: [`Soil: ${pct}%`.padEnd(16), `Status: ${status}`.padEnd(16)] };
  },
};

B.digipot = {
  init: () => ({}),
  tick: (s, p) => {
    const n = clamp(Math.round(p.wiper), 0, 255);
    const vout = +((5 * n) / 256).toFixed(2);
    return {
      n, vout, cmd: `0x11 0x${n.toString(16).toUpperCase().padStart(2, '0')}`,
      rwb: Math.round((10000 * n) / 256 + 52), rwa: Math.round((10000 * (256 - n)) / 256 + 52), adc: Math.round((vout / 5) * 1023),
    };
  },
};

B.btn = {
  init: () => ({ n: 0, prev: false, bounces: 0 }),
  tick: (s, p, dt, inp) => {
    const h = !!inp.held.btn;
    if (h && !s.prev) { s.bounces = 3 + Math.floor(Math.random() * 5); s.n += p.debounce ? 1 : s.bounces; }
    s.prev = h;
    return { count: s.n, pressed: h, bounces: s.bounces };
  },
};

B.melody = {
  init: () => ({ pat: -1, idx: 0, rem: 0 }),
  tick: (s, p, dt) => {
    const seq = PATTERNS[p.pat].s;
    if (s.pat !== p.pat) { s.pat = p.pat; s.idx = 0; s.rem = seq[0][1]; }
    s.rem -= dt;
    while (s.rem <= 0) { s.idx = (s.idx + 1) % seq.length; s.rem += seq[s.idx][1]; }
    const freq = seq[s.idx][0];
    return { freq, buzz: freq > 0, idx: s.idx, seq, name: PATTERNS[p.pat].n, ms: seq[s.idx][1] };
  },
};

B.traffic = {
  init: () => ({ ph: 0, el: 0 }),
  tick: (s, p, dt) => {
    const d = [p.red, p.green, 2].map((x) => x * 1000);
    s.el += dt;
    while (s.el >= d[s.ph]) { s.el -= d[s.ph]; s.ph = (s.ph + 1) % 3; }
    const r = s.ph === 0, g = s.ph === 1, y = s.ph === 2;
    return { r, y, g, phase: ['RED', 'GREEN', 'YELLOW'][s.ph], left: Math.ceil((d[s.ph] - s.el) / 1000), exclusive: r + y + g === 1 };
  },
};

B.ped = {
  init: () => ({ st: 'carGreen', el: 0, req: false, prev: false }),
  tick: (s, p, dt, inp) => {
    const h = !!inp.held.btn;
    if (h && !s.prev) s.req = true;
    s.prev = h; s.el += dt;
    const D = { carYellow: 2000, walk: p.walk * 1000, clear: 2000 };
    if (s.st === 'carGreen') { if (s.req && s.el >= 3000) { s.st = 'carYellow'; s.el = 0; } }
    else if (s.el >= D[s.st]) { s.el = 0; s.st = s.st === 'carYellow' ? 'walk' : s.st === 'walk' ? 'clear' : 'carGreen'; if (s.st === 'carGreen') s.req = false; }
    const cg = s.st === 'carGreen', cy = s.st === 'carYellow', cr = !cg && !cy;
    const pg = s.st === 'walk';
    const pr = !pg && (s.st !== 'clear' || Math.floor(s.el / 250) % 2 === 0);
    return { car: { r: cr, y: cy, g: cg }, ped: { r: pr, g: pg }, state: s.st, requested: s.req, carG: cg, pedG: pg, safe: !(pg && (cg || cy)) };
  },
};

B.menu = {
  init: () => ({ i: 0, scr: 0 }),
  tick: (s, p, dt, inp) => {
    for (const e of inp.ev) {
      if (s.scr === 0) { if (e === 'up') s.i = (s.i + 3) % 4; if (e === 'down') s.i = (s.i + 1) % 4; if (e === 'ok') s.scr = 1; }
      else if (e === 'ok') s.scr = 0;
    }
    const val = [`${p.temp} C`, `${p.hum} %`, `${p.light} %`, 'IoT Lab v1.0'][s.i];
    const lines = s.scr === 0 ? ['== MENU ==', `> ${MENU_ITEMS[s.i]}`] : [MENU_ITEMS[s.i], val];
    return { lines: lines.map((l) => l.padEnd(16)), line2: lines[1], idx: s.i, screen: s.scr ? 'detail' : 'menu' };
  },
};

B.react = {
  init: () => ({ st: 'wait', el: 0, rand: 2000 + Math.random() * 3000, ledAt: 0, rt: null, best: null, prev: false }),
  tick: (s, p, dt, inp) => {
    const h = !!inp.held.btn, edge = h && !s.prev;
    s.prev = h; s.el += dt;
    const restart = () => { s.st = 'wait'; s.el = 0; s.rand = 2000 + Math.random() * 3000; };
    if (s.st === 'wait') {
      if (edge) { s.st = 'early'; s.el = 0; }
      else if (s.el >= (p.delay > 0 ? p.delay : s.rand)) { s.st = 'go'; s.ledAt = s.t; }
    } else if (s.st === 'go') {
      if (edge) { s.rt = Math.round(s.t - s.ledAt); s.best = s.best == null ? s.rt : Math.min(s.best, s.rt); s.st = 'result'; s.el = 0; }
    } else if (s.st === 'early') { if (s.el >= 1500) restart(); }
    else if (s.st === 'result') { if (edge) restart(); }
    const msg = { wait: 'Wait for the LED…', go: 'GO! Press now!', early: 'Too early! Wait for the LED.', result: `${s.rt} ms` }[s.st];
    return { state: s.st, led: s.st === 'go', rt: s.rt, best: s.best, msg };
  },
};

const FACE = [[0, 0, 0, 0], [1, 0, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [0, 1, 1, 0], [1, 1, 1, 0], [0, 1, 1, 1]]; // c, p1, p2, m
B.dice = {
  init: () => ({ v: 0, roll: 0, prev: false, tmr: 0 }),
  tick: (s, p, dt, inp) => {
    const h = !!inp.held.btn;
    if (h && !s.prev && s.roll <= 0) { s.roll = p.roll * 1000; s.tmr = 0; }
    s.prev = h;
    if (s.roll > 0) {
      s.roll -= dt; s.tmr -= dt;
      if (s.tmr <= 0) { s.v = 1 + Math.floor(Math.random() * 6); s.tmr = 100; }
      if (s.roll <= 0) s.v = 1 + Math.floor(Math.random() * 6);
    }
    const f = FACE[s.v];
    const leds = { c: !!f[0], p1: !!f[1], p2: !!f[2], m: !!f[3] };
    const n = (leds.c ? 1 : 0) + (leds.p1 ? 2 : 0) + (leds.p2 ? 2 : 0) + (leds.m ? 2 : 0);
    return { value: s.v, rolling: s.roll > 0, leds, ledsOk: s.v === 0 || n === s.v };
  },
};

export const defaultParams = (project) => Object.fromEntries(project.params.map((q) => [q.k, q.def]));
export function createSim(project) {
  return { kind: project.sim, s: { t: 0, ...B[project.sim].init() }, p: defaultParams(project), inp: { held: {}, ev: [] } };
}
export function stepSim(sim, dt) {
  sim.s.t += dt;
  const out = B[sim.kind].tick(sim.s, sim.p, dt, sim.inp);
  sim.inp.ev = [];
  return out;
}

const matches = (v, e, out) => (typeof e === 'function' ? e(v, out) : Array.isArray(e) ? typeof v === 'number' && v >= e[0] && v <= e[1] : v === e);

// Headless project tests: scripted inputs -> expected outputs.
export function runTests(project) {
  return project.tests.map((t) => {
    const sim = createSim(project);
    let out = stepSim(sim, 0);
    const fails = [];
    for (const st of t.steps) {
      if (st.set) Object.assign(sim.p, st.set);
      if (st.ev) sim.inp.ev.push(...st.ev);
      if (st.hold) {
        sim.inp.held[st.hold[0]] = true;
        for (let i = 0; i < st.hold[1] / 50; i++) out = stepSim(sim, 50);
        sim.inp.held[st.hold[0]] = false;
      }
      const n = st.wait ? st.wait / 50 : st.hold ? 0 : 1;
      for (let i = 0; i < n; i++) out = stepSim(sim, 50);
      for (const [k, e] of Object.entries(st.expect || {})) {
        if (!matches(out[k], e, out)) fails.push(`${k} = ${JSON.stringify(out[k])}`);
      }
    }
    return { name: t.name, pass: fails.length === 0, detail: fails.length ? `Unexpected: ${fails.join('; ')}` : 'Passed' };
  });
}
