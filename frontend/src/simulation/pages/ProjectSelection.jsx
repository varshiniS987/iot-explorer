import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Cpu } from 'lucide-react';
import { PROJECTS } from '../projects/index.js';
import ProjectCard from '../components/ProjectCard.jsx';
import { getAllProgress, getStudentId } from '../utils/progressStorage.js';
import { useSim } from '../utils/simContext.js';

const CATS = ['All', ...new Set(PROJECTS.map((p) => p.category))];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function ProjectSelection() {
  const nav = useNavigate();
  const { basePath, studentName } = useSim();
  const [q, setQ] = useState(''), [cat, setCat] = useState('All'), [lvl, setLvl] = useState('All');
  const prog = getAllProgress();
  const list = useMemo(() => PROJECTS.filter((p) =>
    (cat === 'All' || p.category === cat) && (lvl === 'All' || p.difficulty === lvl) &&
    (p.name + p.description + p.components.join(' ')).toLowerCase().includes(q.toLowerCase())), [q, cat, lvl]);
  const done = PROJECTS.filter((p) => prog[p.id]?.status === 'completed').length;
  return (
    <main className="sim-wrap">
      <header className="mb-5">
        <h1 style={{ fontSize: 30, margin: 0 }}><Cpu style={{ display: 'inline', marginRight: 8 }} color="#22d3ee" />Arduino UNO Simulation Lab</h1>
        <p className="muted">Hi {studentName} ({getStudentId()}). Pick a project. {done} of {PROJECTS.length} completed.</p>
        <div style={{ height: 8, borderRadius: 8, background: '#16214d', overflow: 'hidden', maxWidth: 420 }}><div style={{ width: `${(done / PROJECTS.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)' }} /></div>
      </header>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label className="flex items-center gap-2"><Search size={16} /><input type="search" placeholder="Search projects or parts" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" /></label>
        {LEVELS.map((l) => <button key={l} className={`chip ${lvl === l ? 'on' : ''}`} onClick={() => setLvl(l)} aria-pressed={lvl === l}>{l}</button>)}
      </div>
      <div className="flex flex-wrap gap-2 mb-5">{CATS.map((c) => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)} aria-pressed={cat === c}>{c}</button>)}</div>
      {list.length === 0 && <p className="muted">No projects match. Clear the search or filters.</p>}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))' }}>
        {list.map((p) => <ProjectCard key={p.id} project={p} record={prog[p.id]} onStart={() => nav(`${basePath}/guided/${p.id}`)} />)}
      </div>
    </main>
  );
}
