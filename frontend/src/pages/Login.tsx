import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { REQUIRE_STUDENT_LOGIN } from '../config/auth';
import { api, ApiError } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../store/useAuth';

type Role = 'student' | 'admin';
type Mode = 'login' | 'register';
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Only same-site paths are allowed as the post-login target (prevents open redirects). */
const safeNext = (next: string | null, role: Role) => {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/login')) return null;
  return role === 'admin' ? (next.startsWith('/admin') ? next : null) : (next.startsWith('/admin') ? null : next);
};
const message = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong. Please try again.');

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-bold text-slate-100">{label}{children}</label>;
}

export default function Login() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const next = params.get('next');
  const [role, setRole] = useState<Role>(params.get('role') === 'admin' ? 'admin' : 'student');
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'register' ? 'register' : 'login');
  const [f, setF] = useState({ name: '', email: '', school: '', className: '', city: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const student = useAuth((s) => s.student);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((o) => ({ ...o, [k]: e.target.value }));

  const pickRole = (r: Role) => { setRole(r); setErr(''); setParams(r === 'admin' ? { role: 'admin', ...(next ? { next } : {}) } : (next ? { next } : {}), { replace: true }); };

  const adoptStudent = (b: { name: string; email: string; school: string; class_name: string }) => {
    const auth = useAuth.getState();
    const app = useAppStore.getState();
    // Another student used this browser before: start clean so two students' progress is never mixed.
    if (auth.lastStudentEmail && auth.lastStudentEmail !== b.email) app.resetAll();
    app.setStudent({ studentName: b.name, schoolName: b.school, className: b.class_name });
    auth.loginStudent({ name: b.name, email: b.email });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const email = f.email.trim().toLowerCase();
    if (!EMAIL.test(email)) return setErr('Please enter a valid e-mail address.');
    if (!f.password) return setErr('Please enter your password.');
    if (role === 'student' && mode === 'register') {
      if (f.name.trim().length < 2) return setErr('Please enter your full name.');
      if (f.school.trim().length < 2) return setErr('Please enter your school name.');
      if (!f.className.trim()) return setErr('Please enter your class, for example 8.');
      if (f.password.length < 6) return setErr('Choose a password with at least 6 characters.');
      if (f.password !== f.confirm) return setErr('The two passwords do not match.');
    }
    setBusy(true);
    try {
      if (role === 'admin') {
        const r = await api.adminLogin(email, f.password);
        useAuth.getState().loginAdmin({ email: r.admin.email });
        nav(safeNext(next, 'admin') ?? '/admin', { replace: true });
      } else {
        let b: { name: string; email: string; school: string; class_name: string };
        if (mode === 'register') {
          const body = { name: f.name.trim(), email, school: f.school.trim(), class_name: f.className.trim().slice(0, 10), city: f.city.trim(), password: f.password };
          await api.register(body);
          b = { name: body.name, email, school: body.school, class_name: body.class_name };
        } else {
          b = (await api.studentLogin(email, f.password)).student;
        }
        adoptStudent(b);
        nav(safeNext(next, 'student') ?? '/dashboard', { replace: true });
      }
    } catch (x) { setErr(message(x)); } finally { setBusy(false); }
  };

  const tab = (r: Role) => `flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${role === r ? 'bg-yellow-300 text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`;
  const registering = role === 'student' && mode === 'register';

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-8">
      <div className="glass w-full p-6">
        <h1 className="text-center text-2xl font-extrabold">{role === 'admin' ? 'Admin portal' : registering ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mb-4 mt-1 text-center text-sm text-slate-200">{role === 'admin' ? 'Sign in to manage students, events and results.' : 'Log in to save your progress and take it to any device.'}</p>

        <div role="tablist" aria-label="Portal" className="mb-5 flex gap-2">
          <button type="button" role="tab" aria-selected={role === 'student'} className={tab('student')} onClick={() => pickRole('student')}><GraduationCap size={17} /> Student</button>
          <button type="button" role="tab" aria-selected={role === 'admin'} className={tab('admin')} onClick={() => pickRole('admin')}><ShieldCheck size={17} /> Admin</button>
        </div>

        {role === 'student' && student && (
          <p className="mb-4 rounded-xl border border-emerald-300/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">You are already logged in as <b>{student.name}</b>. <Link to="/dashboard" className="font-bold underline">Go to my dashboard</Link></p>
        )}

        <form onSubmit={submit} className="grid gap-3.5" noValidate>
          {registering && <Field label="Full name"><input className="form-field" autoComplete="name" value={f.name} onChange={set('name')} maxLength={80} /></Field>}
          <Field label={role === 'admin' ? 'Admin e-mail' : 'E-mail'}><input className="form-field" type="email" autoComplete="username" value={f.email} onChange={set('email')} maxLength={120} /></Field>
          {registering && (
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <Field label="School"><input className="form-field" autoComplete="organization" value={f.school} onChange={set('school')} maxLength={120} /></Field>
              <Field label="Class"><input className="form-field" value={f.className} onChange={set('className')} maxLength={10} placeholder="8" /></Field>
            </div>)}
          {registering && <Field label="City (optional)"><input className="form-field" value={f.city} onChange={set('city')} maxLength={80} /></Field>}
          <Field label="Password">
            <span className="relative block">
              <input className="form-field !pr-11" type={show ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} maxLength={100} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-200 hover:bg-white/10" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </span>
          </Field>
          {registering && <Field label="Confirm password"><input className="form-field" type={show ? 'text' : 'password'} autoComplete="new-password" value={f.confirm} onChange={set('confirm')} maxLength={100} /></Field>}

          {err && <p role="alert" className="rounded-xl border border-rose-300/40 bg-rose-500/15 p-3 text-sm text-rose-100">{err}</p>}

          <button type="submit" disabled={busy} className="btn7 btn7-sun mt-1 justify-center">
            {registering ? <UserPlus size={17} /> : <LogIn size={17} />}{busy ? 'Please wait…' : registering ? 'Create account' : role === 'admin' ? 'Sign in as admin' : 'Log in'}
          </button>
        </form>

        {role === 'student' && (
          <p className="mt-4 text-center text-sm text-slate-200">
            {mode === 'login' ? <>New here? <button type="button" className="font-bold underline" onClick={() => { setMode('register'); setErr(''); }}>Create an account</button></>
              : <>Already have an account? <button type="button" className="font-bold underline" onClick={() => { setMode('login'); setErr(''); }}>Log in</button></>}
          </p>)}
        {role === 'student' && !REQUIRE_STUDENT_LOGIN && <p className="mt-2 text-center text-sm"><Link to="/" className="text-cyan-200 underline">Continue without an account</Link></p>}
      </div>
    </div>
  );
}
