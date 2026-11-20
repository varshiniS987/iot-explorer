import { DEFS } from '../utils/partDefs.js';

const Glow = (on, c) => (on ? { fill: c, className: 'glow', style: { color: c } } : { fill: '#334155' });

export default function PartShape({ part, live }) {
  const { type } = part;
  const { w, h } = DEFS[type];
  const L = live;
  switch (type) {
    case 'uno':
      return (<g>
        <rect width={w} height={h} rx="10" fill="#0b6e8e" stroke="#67e8f9" strokeWidth="2" />
        <rect x="-12" y="40" width="46" height="40" rx="4" fill="#9ca3af" />
        <rect x="-12" y="110" width="30" height="36" rx="4" fill="#111827" />
        <circle cx="70" cy="95" r="7" fill="#ef4444" /><rect x="120" y="80" width="90" height="30" rx="3" fill="#111827" />
        <rect x="240" y="110" width="40" height="40" rx="3" fill="#1f2937" />
        <text x="130" y="140" fill="#e0f2fe" fontSize="15" fontWeight="700" textAnchor="middle">ARDUINO UNO</text>
        <text x="130" y="158" fill="#bae6fd" fontSize="9" textAnchor="middle">ATmega328P · 5 V</text>
      </g>);
    case 'led': { const c = part.color || '#ef4444'; return (<g>
      <line x1="10" y1="40" x2="10" y2="80" stroke="#cbd5e1" strokeWidth="2" /><line x1="30" y1="46" x2="30" y2="80" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M6 40 V26 a14 14 0 0 1 28 0 V40 Z" {...Glow(L, c)} stroke="#94a3b8" strokeWidth="1.5" opacity={L ? 1 : 0.6} />
    </g>); }
    case 'res': return (<g><line x1="0" y1="12" x2="80" y2="12" stroke="#cbd5e1" strokeWidth="2" />
      <rect x="15" y="3" width="50" height="18" rx="8" fill="#d6b98a" />
      {['#b45309', '#ef4444', '#ef4444', '#facc15'].map((c, i) => <rect key={i} x={24 + i * 8} y="3" width="3" height="18" fill={c} />)}</g>);
    case 'ultra': return (<g><rect width={w} height="55" rx="6" fill="#1d4ed8" stroke="#93c5fd" />
      {[38, 112].map((x) => <g key={x}><circle cx={x} cy="28" r="22" fill="#cbd5e1" /><circle cx={x} cy="28" r="14" fill="#475569" /></g>)}
      <text x="75" y="32" fill="#fff" fontSize="9" textAnchor="middle" fontWeight="700">HC-SR04</text></g>);
    case 'lm35': return (<g><path d="M8 0 H62 V44 a27 27 0 0 1 -54 0 Z" fill="#111827" stroke="#64748b" /><text x="35" y="30" fill="#e5e7eb" fontSize="11" textAnchor="middle" fontWeight="700">LM35</text></g>);
    case 'dht': return (<g><rect width={w} height="76" rx="6" fill="#38bdf8" stroke="#bae6fd" />
      {[0, 1, 2, 3].map((i) => <line key={i} x1="10" x2="60" y1={14 + i * 12} y2={14 + i * 12} stroke="#0c4a6e" strokeWidth="4" />)}<text x="35" y="70" fill="#0c4a6e" fontSize="9" textAnchor="middle" fontWeight="700">DHT11</text></g>);
    case 'ir': return (<g><rect width={w} height="66" rx="6" fill="#065f46" stroke="#6ee7b7" />
      <ellipse cx="30" cy="26" rx="12" ry="14" fill="#e2e8f0" /><ellipse cx="70" cy="26" rx="12" ry="14" fill="#111827" />
      <text x="50" y="58" fill="#d1fae5" fontSize="9" textAnchor="middle">IR OBSTACLE</text></g>);
    case 'ldr': return (<g><rect width={w} height="66" rx="6" fill="#4338ca" stroke="#a5b4fc" />
      <circle cx="50" cy="28" r="17" fill="#f59e0b" /><path d="M38 28 q6-10 12 0 t12 0" stroke="#78350f" strokeWidth="2" fill="none" />
      <text x="50" y="58" fill="#e0e7ff" fontSize="9" textAnchor="middle">LDR MODULE</text></g>);
    case 'soil': return (<g><rect x="30" y="0" width="40" height="70" rx="4" fill="#92400e" stroke="#fbbf24" /><path d="M42 8 V62 M58 8 V62" stroke="#fde68a" strokeWidth="3" />
      <rect y="70" width={w} height="14" fill="#1e3a8a" /><text x="50" y="80" fill="#fff" fontSize="8" textAnchor="middle">SOIL SENSOR</text></g>);
    case 'buzz': return (<g>
      {L && [0, 1].map((i) => <circle key={i} className="sim-pulse" cx="30" cy="30" r="26" fill="none" stroke="#facc15" strokeWidth="2" style={{ animationDelay: `${i * 0.35}s` }} />)}
      <circle cx="30" cy="30" r="26" fill="#111827" stroke="#64748b" strokeWidth="2" /><circle cx="30" cy="30" r="6" fill="#475569" /><text x="30" y="14" fill="#94a3b8" fontSize="10" textAnchor="middle">+</text></g>);
    case 'lcd': return (<g><rect width={w} height="76" rx="6" fill="#166534" stroke="#86efac" />
      <rect x="10" y="8" width="150" height="40" rx="3" fill="#a3e635" />
      {(L || ['', '']).map((t, i) => <text key={i} x="14" y={24 + i * 16} fontSize="11" fontFamily="monospace" fontWeight="700" fill="#1a2e05" xmlSpace="preserve">{t.slice(0, 16)}</text>)}
      <text x="85" y="68" fill="#bbf7d0" fontSize="8" textAnchor="middle">I2C BACKPACK</text></g>);
    case 'btn': return (<g><line x1="0" y1="25" x2="60" y2="25" stroke="#cbd5e1" strokeWidth="2" /><rect x="10" y="5" width="40" height="40" rx="6" fill="#374151" stroke="#9ca3af" />
      <circle cx="30" cy={L ? 27 : 25} r="13" fill={L ? '#dc2626' : '#ef4444'} stroke="#7f1d1d" strokeWidth="2" /></g>);
    case 'btn3': return (<g><rect width={w} height="56" rx="6" fill="#1f2937" stroke="#9ca3af" />
      {['UP', 'DN', 'OK'].map((t, i) => <g key={t}><circle cx={17 + i * 32} cy="26" r="12" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2" /><text x={17 + i * 32} y="30" fontSize="8" fill="#fff" textAnchor="middle" fontWeight="700">{t}</text></g>)}</g>);
    case 'reed': return (<g><line x1="0" y1="18" x2="100" y2="18" stroke="#cbd5e1" strokeWidth="2" /><rect x="15" y="9" width="70" height="18" rx="9" fill="#bae6fd" opacity=".55" stroke="#e0f2fe" /><path d="M24 18 H48 M52 18 H76" stroke="#94a3b8" strokeWidth="3" /></g>);
    case 'tlm': return (<g><rect width={w} height="115" rx="8" fill="#111827" stroke="#64748b" />
      {[['r', '#ef4444'], ['y', '#facc15'], ['g', '#22c55e']].map(([k, c], i) => <circle key={k} cx="35" cy={24 + i * 34} r="13" {...Glow(L?.[k], c)} stroke="#475569" opacity={L?.[k] ? 1 : 0.5} />)}</g>);
    case 'ped': return (<g><rect width={w} height="85" rx="8" fill="#111827" stroke="#64748b" />
      {[['r', '#ef4444'], ['g', '#22c55e']].map(([k, c], i) => <circle key={k} cx="28" cy={26 + i * 36} r="13" {...Glow(L?.[k], c)} stroke="#475569" opacity={L?.[k] ? 1 : 0.5} />)}</g>);
    case 'mcp': return (<g><rect y="10" width={w} height="50" rx="4" fill="#111827" stroke="#64748b" /><path d="M55 10 a10 10 0 0 0 20 0" fill="#0b1020" /><text x="65" y="42" fill="#e5e7eb" fontSize="11" textAnchor="middle" fontWeight="700">MCP41010</text></g>);
    case 'dice': return (<g><rect width={w} height="76" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
      {[[22, 18, 'p1'], [68, 58, 'p1'], [68, 18, 'p2'], [22, 58, 'p2'], [45, 38, 'c'], [22, 38, 'm'], [68, 38, 'm']].map(([x, y, k], i) => <circle key={i} cx={x} cy={y} r="7" fill={L?.[k] ? '#dc2626' : '#cbd5e1'} />)}</g>);
    default: return null;
  }
}
