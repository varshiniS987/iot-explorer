import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Loads data and exposes {data, error, loading, reload}. Previous data stays visible while reloading. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T | null; error: string; loading: boolean }>({ data: null, error: '', loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn().then((data) => { if (alive) setState({ data, error: '', loading: false }); })
      .catch((e) => { if (alive) setState({ data: null, error: e instanceof Error ? e.message : String(e), loading: false }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
export const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');

export function Panel({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass p-5 ${className}`}>
      {(title || action) && <div className="mb-3 flex flex-wrap items-center justify-between gap-2">{title && <h2 className="text-lg font-extrabold">{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="glass p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-cyan-100/80">{label}</div>
      <div className="mt-1 text-3xl font-extrabold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-300">{hint}</div>}
    </div>
  );
}

/** Horizontal bars: one row per item. */
export function Bars({ items, empty = 'No data yet.' }: { items: { label: string; value: number }[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-sm text-slate-300">{empty}</p>;
  return (
    <ul className="grid gap-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="truncate" title={i.label}>{i.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-cyan-300" style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <b className="text-right">{i.value}</b>
        </li>
      ))}
    </ul>
  );
}

export function Loading() { return <p className="p-6 text-center text-slate-300" role="status">Loading…</p>; }

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-300/40 bg-rose-500/15 p-4 text-sm text-rose-100" role="alert">
      {message}
      {onRetry && <button className="btn7 btn7-glass ml-3" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Badge({ tone = 'slate', children }: { tone?: 'slate' | 'green' | 'amber' | 'blue'; children: ReactNode }) {
  const c = { slate: 'bg-white/10 text-slate-200', green: 'bg-emerald-400/20 text-emerald-100', amber: 'bg-amber-300/20 text-amber-100', blue: 'bg-cyan-300/20 text-cyan-100' }[tone];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${c}`}>{children}</span>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="glass max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5" style={{ background: '#0d2a5aee' }}>
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">{title}</h2>
          <button className="btn7 btn7-glass" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        {children}
      </div>
    </div>
  );
}

export const th = 'px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-cyan-100/80';
export const td = 'px-3 py-2 align-middle';
