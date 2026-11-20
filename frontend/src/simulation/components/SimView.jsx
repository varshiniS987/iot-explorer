import { useRef, useState } from 'react';
import { useBuzzer } from '../utils/useSimulation.js';

const ZC = { safe: '#22c55e', caution: '#facc15', warning: '#fb923c', stop: '#ef4444' };
const Big = ({ children, color = '#22d3ee' }) => <div style={{ fontSize: 34, fontWeight: 800, color, textAlign: 'center' }}>{children}</div>;
const Lcd = ({ lines }) => <div className="lcd" role="img" aria-label={`LCD shows ${lines.join(' / ')}`}>{lines.map((l) => l.padEnd(16)).join('\n')}</div>;
const Banner = ({ on, text }) => (on ? <div role="alert" style={{ background: '#7f1d1d', color: '#fecaca', padding: '6px 12px', borderRadius: 8, textAlign: 'center', fontWeight: 700 }}>{text}</div> : null);

function Gauge({ value, min, max, unit, color = '#22d3ee', mark }) {
  const f = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const pt = (r, a) => [100 + r * Math.sin((a * Math.PI) / 180), 100 - r * Math.cos((a * Math.PI) / 180)];
  const arc = (a0, a1) => { const [x0, y0] = pt(70, a0), [x1, y1] = pt(70, a1); return `M${x0},${y0} A70,70 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`; };
  const a = -120 + f * 240;
  return (
    <svg viewBox="0 0 200 150" style={{ width: '100%', maxWidth: 260, margin: '0 auto', display: 'block' }}>
      <path d={arc(-120, 120)} stroke="#1e293b" strokeWidth="14" fill="none" strokeLinecap="round" />
      {f > 0 && <path d={arc(-120, a)} stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" className="glow" style={{ color }} />}
      {mark != null && (() => { const m = -120 + Math.min(1, Math.max(0, (mark - min) / (max - min))) * 240; const [x0, y0] = pt(58, m), [x1, y1] = pt(84, m); return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fff" strokeWidth="3" />; })()}
      <g style={{ transform: `rotate(${a}deg)`, transformOrigin: '100px 100px', transition: 'transform .3s' }}><line x1="100" y1="100" x2="100" y2="44" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" /></g>
      <circle cx="100" cy="100" r="6" fill="#f8fafc" />
      <text x="100" y="132" textAnchor="middle" fill={color} fontSize="20" fontWeight="800">{value}{unit}</text>
    </svg>
  );
}

function PressBtn({ label, k, ev, sim, small }) {
  const [down, setDown] = useState(false);
  const t0 = useRef(0), on = useRef(false);
  const press = () => { if (!sim.running || on.current) return; on.current = true; setDown(true); t0.current = Date.now(); if (ev) sim.send(ev); else sim.hold(k, true); };
  const release = () => {
    if (!on.current) return;
    setTimeout(() => { on.current = false; setDown(false); if (!ev) sim.hold(k, false); }, Math.max(0, 120 - (Date.now() - t0.current)));
  };
  return (
    <button className={`sbtn${down ? ' down' : ''}`} style={small ? { width: 56, height: 56, fontSize: 12, background: 'radial-gradient(circle at 30% 30%,#3b82f6,#1e3a8a)' } : undefined}
      disabled={!sim.running} aria-label={label} onPointerDown={press} onPointerUp={release} onPointerLeave={release}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); press(); } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') release(); }}>{label}</button>
  );
}

function Housing({ lights }) {
  return (
    <svg viewBox={`0 0 70 ${lights.length * 36 + 8}`} style={{ width: 70 }}>
      <rect width="70" height={lights.length * 36 + 8} rx="12" fill="#111827" stroke="#64748b" />
      {lights.map(([on, c], i) => <circle key={i} cx="35" cy={26 + i * 36} r="14" fill={on ? c : '#1f2937'} className={on ? 'glow' : ''} style={{ color: c }} />)}
    </svg>
  );
}

export default function SimView({ project, sim, muted }) {
  const { out, values: v, running } = sim;
  useBuzzer(running && !!out.buzz, out.freq, !muted);
  const Pulse = () => (running && out.buzz ? <svg viewBox="0 0 60 60" style={{ width: 50, margin: '0 auto', display: 'block' }}><circle cx="30" cy="30" r="12" fill="#facc15" />{[0, 1].map((i) => <circle key={i} className="sim-pulse" cx="30" cy="30" r="14" fill="none" stroke="#facc15" strokeWidth="3" style={{ animationDelay: `${i * 0.3}s` }} />)}</svg> : null);
  let body = null;
  switch (project.sim) {
    case 'ultra': case 'parking': {
      const x = 70 + (Math.min(v.dist, 450) / 450) * 300, park = project.sim === 'parking', zc = park ? ZC[out.zone] : '#a78bfa';
      body = (<>
        <svg viewBox="0 0 420 150" style={{ width: '100%' }}>
          <defs><clipPath id="wc"><rect x="60" y="0" width={Math.max(0, x - 60)} height="150" /></clipPath></defs>
          <rect x="10" y="50" width="50" height="50" rx="6" fill="#1d4ed8" /><circle cx="35" cy="75" r="14" fill="#cbd5e1" />
          {running && <g clipPath="url(#wc)">{[0, 1, 2].map((i) => <circle key={i} className="wave" cx="60" cy="75" r="250" fill="none" stroke="#22d3ee" strokeWidth="3" style={{ animationDelay: `${i * 0.6}s` }} />)}</g>}
          {park ? <g><rect x={x} y="58" width="52" height="34" rx="10" fill={zc} /><circle cx={x + 12} cy="94" r="6" fill="#111" /><circle cx={x + 40} cy="94" r="6" fill="#111" /></g> : <rect x={x} y="45" width="26" height="60" rx="4" fill={zc} />}
        </svg>
        <Big color={zc}>{out.reading == null ? 'Out of range' : `${out.reading} cm`}</Big>
        {park && <><p className="muted" style={{ textAlign: 'center', margin: '4px 0' }}>Zone: <b style={{ color: zc }}>{out.zone}</b></p><Pulse /></>}
      </>);
      break; }
    case 'temp': body = (<><Gauge value={out.reading} min={0} max={100} unit="°C" color="#fb923c" /><p className="muted" style={{ textAlign: 'center' }}>Sensor: {out.mv} mV → ADC {out.adc} → {out.reading} °C</p></>); break;
    case 'tempalarm': body = (<><Gauge value={out.reading} min={0} max={100} unit="°C" color={out.alarm ? '#ef4444' : '#fb923c'} mark={v.thr} /><p className="muted" style={{ textAlign: 'center' }}>White mark = limit ({v.thr} °C)</p><Pulse /><Banner on={out.alarm} text="TEMPERATURE ALARM" /></>); break;
    case 'hum': body = (<><Gauge value={out.hum} min={0} max={100} unit="%" color="#38bdf8" /><p className="muted" style={{ textAlign: 'center' }}>Temperature {out.temp} °C · next DHT11 reading in {out.next}s</p></>); break;
    case 'lamp': body = (
      <div style={{ background: `rgba(250,204,21,${v.light / 160})`, borderRadius: 12, padding: 10, transition: '.3s' }}>
        <svg viewBox="0 0 200 130" style={{ width: '100%', maxWidth: 240, display: 'block', margin: '0 auto' }}>
          <circle cx="100" cy="55" r="34" fill={out.lamp ? '#fde047' : '#334155'} className={out.lamp ? 'glow' : ''} style={{ color: '#fde047' }} />
          <rect x="84" y="86" width="32" height="22" rx="4" fill="#64748b" />
        </svg>
        <Big color={out.lamp ? '#854d0e' : '#e5ecff'}>{out.lamp ? 'Lamp ON' : 'Lamp OFF'}</Big>
        <p className="muted" style={{ textAlign: 'center', color: '#1e293b' }}>Sensor value {out.adc}/1023 · switch point {Math.round(v.thr * 10.23)}</p>
      </div>); break;
    case 'ir': body = (<>
      <svg viewBox="0 0 420 150" style={{ width: '100%' }}>
        <rect x="190" y="5" width="40" height="30" rx="4" fill="#065f46" /><circle cx="210" cy="20" r="8" fill="#111827" />
        {running && <path d="M210 30 V105" stroke={out.detected ? '#ef4444' : '#22d3ee'} strokeDasharray="5 4" strokeWidth="3" />}
        <rect x="10" y="108" width="400" height="14" rx="6" fill="#334155" />
        {out.objs.map((o, i) => <rect key={i} x={10 + o.x * 4 - (o.w * 4) / 2} y="70" width={o.w * 4} height="38" rx="4" fill="#a78bfa" />)}
      </svg>
      <Big>Count: {out.count}</Big>
      <p className="muted" style={{ textAlign: 'center' }}>OUT pin: {out.pin ? 'HIGH (clear)' : 'LOW (object)'}</p>
      <div className="flex gap-2 justify-center"><button className="sim-btn" disabled={!running} onClick={() => sim.send('obj')}>Add object</button><button className="sim-btn" disabled={!running} onClick={() => sim.send('long')}>Add long object</button></div>
    </>); break;
    case 'door': body = (<>
      <svg viewBox="0 0 300 150" style={{ width: '100%', maxWidth: 340, display: 'block', margin: '0 auto' }}>
        <rect x="40" y="10" width="190" height="130" fill="none" stroke="#64748b" strokeWidth="8" />
        <g style={{ transform: `scaleX(${v.open ? 0.22 : 1})`, transformOrigin: '44px 20px', transition: 'transform .5s' }}><rect x="44" y="14" width="182" height="122" fill="#92400e" /><circle cx="205" cy="80" r="6" fill="#fbbf24" /></g>
        <rect x="236" y="30" width="14" height="30" fill="#60a5fa" /><rect x={v.open ? 262 : 236} y="30" width="12" height="30" fill="#ef4444" style={{ transition: '.5s' }} />
      </svg>
      <div className="flex justify-center"><button className="sim-btn" onClick={() => sim.setParam('open', !v.open)}>{v.open ? 'Close door' : 'Open door'}</button></div>
      <p className="muted" style={{ textAlign: 'center' }}>D2 reads {out.pin ? 'HIGH (door open)' : 'LOW (door closed)'} · open for {(out.openMs / 1000).toFixed(1)} s</p><Pulse /><Banner on={out.alarm} text="DOOR ALERT" />
    </>); break;
    case 'soil': body = (<><Lcd lines={out.lines} /><svg viewBox="0 0 200 70" style={{ width: '100%', maxWidth: 260, margin: '10px auto 0', display: 'block' }}><rect x="10" y="10" width="180" height="40" rx="8" fill="#451a03" /><rect x="10" y="10" width={1.8 * out.pct} height="40" rx="8" fill="#38bdf8" opacity=".8" /><text x="100" y="66" fill="#93a4d0" fontSize="11" textAnchor="middle">Sensor value {out.adc}/1023</text></svg></>); break;
    case 'digipot': body = (<>
      <div className="flex items-center justify-around">
        <svg viewBox="0 0 120 120" style={{ width: 110 }}><circle cx="60" cy="60" r="44" fill="#1e293b" stroke="#22d3ee" strokeWidth="3" /><g style={{ transform: `rotate(${-135 + (out.n / 255) * 270}deg)`, transformOrigin: '60px 60px', transition: 'transform .2s' }}><line x1="60" y1="60" x2="60" y2="22" stroke="#facc15" strokeWidth="5" strokeLinecap="round" /></g></svg>
        <svg viewBox="0 0 60 60" style={{ width: 70 }}><circle cx="30" cy="30" r="20" fill="#22d3ee" opacity={0.1 + 0.9 * (out.n / 255)} className="glow" style={{ color: '#22d3ee' }} /></svg>
      </div>
      <Big>{out.vout.toFixed(2)} V</Big>
      <p className="muted" style={{ textAlign: 'center' }}>SPI bytes sent: <b style={{ color: '#e5ecff' }}>{out.cmd}</b> · R(W-B) {out.rwb} Ω · R(W-A) {out.rwa} Ω · ADC {out.adc}</p>
    </>); break;
    case 'btn': body = (<><div className="flex justify-center"><PressBtn label="PRESS" k="btn" sim={sim} /></div><Big>Count: {out.count}</Big><p className="muted" style={{ textAlign: 'center' }}>Last press made {out.bounces} contact bounces: {v.debounce ? 'filtered by debounce' : 'counted as extra presses!'}</p></>); break;
    case 'melody': body = (<>
      <svg viewBox="0 0 400 70" style={{ width: '100%' }}>{(() => { const tot = out.seq.reduce((a, s) => a + s[1], 0); let x = 0; return out.seq.map(([f, ms], i) => { const w = (ms / tot) * 400; const el = <rect key={i} x={x + 1} y={f ? 60 - Math.min(55, f / 20) : 56} width={Math.max(2, w - 2)} height={f ? Math.min(55, f / 20) : 4} rx="2" fill={i === out.idx && running ? '#facc15' : '#3b82f6'} />; x += w; return el; }); })()}</svg>
      <Big color="#facc15">{out.freq ? `${out.freq} Hz` : 'silence'}</Big><p className="muted" style={{ textAlign: 'center' }}>{out.name} · step {out.idx + 1}/{out.seq.length} · {out.ms} ms</p><Pulse />
    </>); break;
    case 'traffic': body = (<div className="flex items-center justify-center gap-6"><Housing lights={[[out.r, '#ef4444'], [out.y, '#facc15'], [out.g, '#22c55e']]} /><div><Big>{out.phase}</Big><p className="muted">{running ? `${out.left}s left` : 'stopped'}</p></div></div>); break;
    case 'ped': body = (<>
      <div className="flex items-center justify-around"><div><Housing lights={[[out.car.r, '#ef4444'], [out.car.y, '#facc15'], [out.car.g, '#22c55e']]} /><p className="muted" style={{ textAlign: 'center' }}>Cars</p></div>
        <PressBtn label="CROSS" k="btn" sim={sim} />
        <div><Housing lights={[[out.ped.r, '#ef4444'], [out.ped.g, '#22c55e']]} /><p className="muted" style={{ textAlign: 'center' }}>People</p></div></div>
      <p className="muted" style={{ textAlign: 'center' }}>State: <b style={{ color: '#e5ecff' }}>{out.state}</b>{out.requested ? ' · crossing requested' : ''}</p>
    </>); break;
    case 'menu': body = (<><Lcd lines={out.lines} /><div className="flex justify-center gap-4 mt-3"><PressBtn small label="UP" ev="up" sim={sim} /><PressBtn small label="DOWN" ev="down" sim={sim} /><PressBtn small label="OK" ev="ok" sim={sim} /></div></>); break;
    case 'react': body = (<>
      <svg viewBox="0 0 60 60" style={{ width: 70, margin: '0 auto', display: 'block' }}><circle cx="30" cy="30" r="22" fill={out.led ? '#22c55e' : '#1f2937'} className={out.led ? 'glow' : ''} style={{ color: '#22c55e' }} stroke="#64748b" strokeWidth="2" /></svg>
      <Big color={out.state === 'early' ? '#ef4444' : '#22d3ee'}>{out.msg}</Big>
      <div className="flex justify-center my-2"><PressBtn label="PRESS" k="btn" sim={sim} /></div>
      <p className="muted" style={{ textAlign: 'center' }}>Best: {out.best == null ? '—' : `${out.best} ms`} · press again after a result to restart</p>
    </>); break;
    case 'dice': body = (<>
      <svg viewBox="0 0 120 120" style={{ width: 130, margin: '0 auto', display: 'block' }}>
        <rect x="5" y="5" width="110" height="110" rx="18" fill="#f8fafc" />
        {[[30, 30, 'p1'], [90, 90, 'p1'], [90, 30, 'p2'], [30, 90, 'p2'], [60, 60, 'c'], [30, 60, 'm'], [90, 60, 'm']].map(([x, y, k], i) => <circle key={i} cx={x} cy={y} r="10" fill={out.leds[k] ? '#dc2626' : '#e2e8f0'} />)}
      </svg>
      <Big>{out.value || '–'}</Big><div className="flex justify-center my-2"><PressBtn label="ROLL" k="btn" sim={sim} /></div>
      <p className="muted" style={{ textAlign: 'center' }}>{out.rolling ? 'Rolling…' : out.value ? `You rolled a ${out.value}` : 'Press ROLL'}</p>
    </>); break;
    default: break;
  }
  return <div className="panel" aria-live="polite"><h3>Live simulation {running ? '· running' : '· stopped'}</h3>{body}</div>;
}
