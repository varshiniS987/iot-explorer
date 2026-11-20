import { motion } from 'framer-motion';
import { Ruler, Car, Moon, ScanLine, DoorOpen, Thermometer, Droplets, BellRing, Sprout, SlidersHorizontal, MousePointerClick, Music, TrafficCone, Footprints, Menu, Timer, Dices, Play, CheckCircle2 } from 'lucide-react';

const ICONS = {
  'ultrasonic-distance-meter': Ruler, 'parking-distance-alert': Car, 'automatic-night-lamp': Moon, 'ir-object-counter': ScanLine,
  'door-entry-alert': DoorOpen, 'temperature-monitor': Thermometer, 'humidity-monitor': Droplets, 'temperature-warning-alarm': BellRing,
  'soil-moisture-lcd': Sprout, 'digital-potentiometer-demo': SlidersHorizontal, 'push-button-counter': MousePointerClick,
  'buzzer-melody-patterns': Music, 'traffic-light-controller': TrafficCone, 'pedestrian-crossing-signal': Footprints,
  'lcd-menu-system': Menu, 'electronic-reaction-timer': Timer, 'digital-dice': Dices,
};

export default function ProjectCard({ project, record, onStart }) {
  const Icon = ICONS[project.id] || Ruler;
  const done = record?.status === 'completed';
  return (
    <motion.article className="panel pcard" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}>
      <div className="art"><Icon size={46} color="#fff" style={{ position: 'relative' }} aria-hidden /></div>
      <div className="flex items-start justify-between gap-2">
        <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.3 }}>{project.no}. {project.name}</h2>
      </div>
      <div className="flex items-center gap-2"><span className={`badge b-${project.difficulty}`}>{project.difficulty}</span>
        {done && <span className="badge" style={{ background: '#064e3b', color: '#6ee7b7' }}><CheckCircle2 size={11} style={{ display: 'inline' }} /> Completed</span>}
        {!done && record?.guidedCompleted && <span className="badge" style={{ background: '#1e3a8a', color: '#bfdbfe' }}>Guided done</span>}
      </div>
      <p className="muted" style={{ margin: 0 }}>{project.description}</p>
      <div className="flex flex-wrap gap-1">{project.components.map((c) => <span key={c} className="chip" style={{ cursor: 'default' }}>{c}</span>)}</div>
      <button className="sim-btn sim-btn-primary" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={onStart}><Play size={15} />Start Project</button>
    </motion.article>
  );
}
