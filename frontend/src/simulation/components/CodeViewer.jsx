import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const KW = new Set('if else for while return void const bool true false new include define'.split(' '));
const TY = new Set('int long float byte char unsigned String LiquidCrystal_I2C DHT'.split(' '));
const FN = new Set('pinMode digitalWrite digitalRead analogRead delay delayMicroseconds pulseIn tone noTone millis random randomSeed map constrain begin print println setCursor clear init backlight transfer'.split(' '));
const RX = /(\/\/.*$)|("[^"]*")|(#\w+)|\b(\d+\.?\d*)\b|\b([A-Za-z_]\w*)\b/g;

function hl(line) {
  const out = []; let last = 0, m, i = 0;
  RX.lastIndex = 0;
  while ((m = RX.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [t, com, str, pre, num, id] = m;
    let cls = null;
    if (com) cls = 'c'; else if (str) cls = 's'; else if (pre) cls = 'p'; else if (num) cls = 'n';
    else if (KW.has(id)) cls = 'k'; else if (TY.has(id)) cls = 't'; else if (FN.has(id)) cls = 't';
    out.push(cls ? <span key={i++} className={cls}>{t}</span> : t);
    last = m.index + t.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export default function CodeViewer({ project }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(project.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-2">
        <h3 style={{ margin: 0 }}>Arduino code (C++)</h3>
        <button className="sim-btn" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy Code'}</button>
      </div>
      <pre className="code" tabIndex={0} aria-label="Arduino source code">{project.code.split('\n').map((l, i) => <div key={i}>{hl(l) || ' '}{'\n'}</div>)}</pre>
      <p className="muted" style={{ margin: '8px 0 4px' }}>The browser runs a JavaScript model of this program. It does not compile Arduino C++.</p>
      <ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>
        {project.explain.map(([f, t]) => <li key={f}><b style={{ color: '#e5ecff' }}>{f}</b>: {t}</li>)}
      </ul>
    </div>
  );
}
