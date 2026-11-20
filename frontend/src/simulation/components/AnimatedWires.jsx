import { motion } from 'framer-motion';
import { pinPos, wirePath, wireColor } from '../utils/partDefs.js';

// wires: [[a, b], ...]. animateLast draws the newest wire with a path animation.
export default function AnimatedWires({ project, wires, animateLast, onWireClick }) {
  return (
    <g fill="none" strokeLinecap="round">
      {wires.map(([a, b, col], i) => {
        const d = wirePath(pinPos(project, a), pinPos(project, b));
        const c = col || wireColor(a, b, i);
        const last = animateLast && i === wires.length - 1;
        return (
          <g key={`${a}-${b}-${i}`}>
            <path d={d} stroke={c} strokeWidth="9" opacity="0.18" />
            {last ? (
              <motion.path d={d} stroke={c} strokeWidth="3.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
            ) : (
              <path d={d} stroke={c} strokeWidth="3.5" />
            )}
            {onWireClick && (
              <path d={d} stroke="transparent" strokeWidth="16" style={{ cursor: 'pointer', pointerEvents: 'stroke' }} onClick={() => onWireClick(i)}>
                <title>Click to remove this wire</title>
              </path>
            )}
          </g>
        );
      })}
    </g>
  );
}
