import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { BookOpen, Box, Cpu, Gamepad2, HelpCircle, Home, LayoutDashboard, Menu, Trophy, X } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';

const MAIN = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/academy', label: 'Learn', icon: BookOpen },
  { to: '/explore', label: '3D Kit', icon: Box },
  { to: '/simulator', label: 'Build', icon: Cpu },
  { to: '/game', label: 'Play', icon: Gamepad2 },
  { to: '/quiz', label: 'Quiz', icon: HelpCircle },
  { to: '/events', label: 'Events', icon: Trophy },
  { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
];
const link = ({ isActive }: { isActive: boolean }) => `nav7-link${isActive ? ' on' : ''}`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { level, xp, title, avatar } = useProgress();

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <header className="nav7">
      <div className="nav7-bar">
        <Link to="/" className="nav7-logo">
          <span className="nav7-logo-cube"><Cpu size={21} /></span>
          <span><b>IoT Explorer</b><small>Learn · Build · Play</small></span>
        </Link>

        <nav className="nav7-links" aria-label="Main">
          {MAIN.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={link}><Icon size={16} />{label}</NavLink>)}
        </nav>

        <Link to="/dashboard" className="nav7-xp" title="Open my dashboard">
          <span className="nav7-avatar">{avatar}</span>
          <span><b>Level {level} · {title}</b><small>{xp} XP</small></span>
        </Link>
        <button className="nav7-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>

      {open && (
        <nav className="nav7-mobile" aria-label="Mobile">
          {MAIN.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={link}><Icon size={17} />{label}</NavLink>)}
        </nav>
      )}
    </header>
  );
}