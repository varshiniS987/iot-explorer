import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Award, Cpu, LayoutDashboard, LogOut, MessageSquare, Trophy, Users } from 'lucide-react';
import { api, getAdminToken } from '../../services/api';
import { useAuth } from '../../store/useAuth';

const ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users, end: false },
  { to: '/admin/submissions', label: 'Event submissions', icon: Trophy, end: false },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare, end: false },
  { to: '/admin/certificates', label: 'Certificates', icon: Award, end: false },
];

/** Every /admin page renders inside this layout. Without a valid admin session it redirects to the login page. */
export default function AdminLayout() {
  const admin = useAuth((s) => s.admin);
  const logout = useAuth((s) => s.logout);
  const loc = useLocation();
  const valid = !!admin && !!getAdminToken();

  // Confirms the session with the server; a rejected token signs the admin out (see api.ts).
  useEffect(() => { if (valid) api.adminMe().catch(() => { /* handled by the 401 event */ }); }, [valid]);

  if (!valid) return <Navigate to={`/login?role=admin&next=${encodeURIComponent(loc.pathname)}`} replace />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <header className="glass mb-5 flex flex-wrap items-center gap-3 p-3 pl-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/20"><Cpu size={20} /></span>
        <div className="mr-auto leading-tight"><b className="block text-lg">IoT Explorer · Admin portal</b><small className="text-slate-300">Signed in as {admin?.email}</small></div>
        <Link to="/" className="btn7 btn7-glass">Student site</Link>
        <button className="btn7 btn7-coral" onClick={() => logout('admin')}><LogOut size={16} /> Log out</button>
      </header>
      <div className="grid gap-5 md:grid-cols-[13.5rem_minmax(0,1fr)]">
        <nav aria-label="Admin" className="flex gap-2 overflow-x-auto md:grid md:content-start md:overflow-visible">
          {ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-bold transition ${isActive ? 'border-cyan-200/60 bg-cyan-300/20 text-white' : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'}`}>
              <Icon size={17} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
