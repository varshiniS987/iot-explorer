import { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import PartShape from './Parts.jsx';
import AnimatedWires from './AnimatedWires.jsx';
import { DEFS, allPins } from '../utils/partDefs.js';

export default function CircuitBoard({ project, wires, live = {}, interactive = false, pending, onPinClick, onWireClick, animateLast = false, activePins = [] }) {
  const [zoom, setZoom] = useState(1);
  const used = new Set(wires.flatMap((w) => [w[0], w[1]]));
  const pins = allPins(project);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="muted">{interactive ? 'Click a pin, then click another pin to place a wire. Click a wire to remove it.' : 'Circuit diagram'}</span>
        <span className="flex gap-1">
          <button className="sim-btn" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}><ZoomOut size={16} /></button>
          <button className="sim-btn" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}><ZoomIn size={16} /></button>
        </span>
      </div>
      <div style={{ overflow: 'auto', borderRadius: 14, border: '1px solid var(--line)', background: '#050a1c' }}>
        <svg viewBox="0 0 800 500" style={{ width: `${zoom * 100}%`, minWidth: 560, display: 'block' }} role="img" aria-label={`Circuit for ${project.name}`}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#14214a" strokeWidth="1" /></pattern>
          </defs>
          <rect width="800" height="500" fill="url(#grid)" />
          {project.parts.map((p) => (
            <g key={p.id} transform={`translate(${p.x},${p.y})`}>
              <PartShape part={p} live={live[p.id]} />
              {p.type !== 'uno' && p.type !== 'res' && <text x={DEFS[p.type].w / 2} y={-6} fill="#93a4d0" fontSize="10" textAnchor="middle">{p.label}</text>}
              {p.type === 'res' && <text x="40" y="-4" fill="#93a4d0" fontSize="10" textAnchor="middle">{p.label}</text>}
            </g>
          ))}
          <AnimatedWires project={project} wires={wires} animateLast={animateLast} onWireClick={interactive ? onWireClick : null} />
          {pins.map(({ id, part, def }) => {
            const [, label, x, y, side] = def;
            const cx = part.x + x, cy = part.y + y;
            const inside = DEFS[part.type].inside;
            const ly = side === 't' ? (inside ? cy + 13 : cy - 7) : (inside ? cy - 7 : cy + 14);
            const active = pending === id || activePins.includes(id);
            return (
              <g key={id}>
                {!DEFS[part.type].noLabel && side !== 'l' && side !== 'r' && (
                  <text x={cx} y={ly} fill={inside ? '#e0f2fe' : '#cbd5e1'} fontSize="8" textAnchor="middle" pointerEvents="none">{label}</text>
                )}
                <circle
                  className={interactive ? 'pin' : ''} cx={cx} cy={cy} r={interactive ? 6 : 4.5}
                  fill={active ? '#facc15' : used.has(id) ? '#22d3ee' : '#64748b'} stroke="#0b1020" strokeWidth="1.5"
                  tabIndex={interactive ? 0 : -1} role={interactive ? 'button' : undefined}
                  aria-label={interactive ? `Pin ${part.label || part.type} ${label}` : undefined}
                  onClick={interactive ? () => onPinClick?.(id) : undefined}
                  onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPinClick?.(id); } } : undefined}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
