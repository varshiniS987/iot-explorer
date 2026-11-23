import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import { useProgress } from '../hooks/useProgress';

export default function Dashboard() {
  const { s, items, pct, xp, level, title, avatar, into, need, next } = useProgress();

  return (
    <div className="page7 dash7">
      <section className="dash-hero">
        <div className="dash-who">
          <div className="dash-avatar">{avatar}</div>
          <div>
            <p className="dash-hi">{s.studentName ? `Hi, ${s.studentName}!` : 'Hi, Explorer!'}</p>
            <h1>Level {level}: {title}</h1>
            <div className="xp7" aria-label={`${into} of ${need} XP to next level`}><i style={{ width: `${(into / need) * 100}%` }} /></div>
            <p className="dash-sub">{xp} XP total · {need - into} XP to Level {level + 1}</p>
            {next && <Link to={next.to} className="dash-next">Next step: {next.cta} <ArrowRight size={15} /></Link>}
          </div>
        </div>
        <ProgressRing pct={pct} size={170}><b>{pct}%</b><small>overall</small></ProgressRing>
      </section>

      <h2 className="dash-h">My progress</h2>
      <section className="stat-grid">
        {items.map((i) => {
          const f = Math.round((i.done / i.total) * 100);
          return (
            <Link key={i.key} to={i.to} className="stat7" style={{ '--c': i.color } as CSSProperties}>
              <span className="stat7-emoji">{i.emoji}</span>
              <b className="stat7-num">{i.text ?? `${i.done} / ${i.total}`}</b>
              <span className="stat7-label">{i.label}</span>
              <span className="bar7"><i style={{ width: `${f}%` }} /></span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
