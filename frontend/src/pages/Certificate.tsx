import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Download } from 'lucide-react';
import { PASS_PERCENT } from '../data/quizLevels';
import { useAutoCertificate } from '../hooks/useAutoCertificate';

const Row = ({ ok, text, to }: { ok: boolean; text: string; to: string }) => (
  <li className="flex flex-wrap items-center gap-2">{ok ? <CheckCircle2 className="text-emerald-300" size={18} /> : <Circle className="text-slate-500" size={18} />}<span className={ok ? '' : 'text-slate-300'}>{text}</span>{!ok && <Link className="ml-auto text-sm font-bold text-cyan-200 underline" to={to}>Go</Link>}</li>
);

export default function Certificate() {
  const c = useAutoCertificate();
  const ready = c.passed && c.profileOk && !!c.quiz;
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold">Certificate</h1>
      <p className="mb-4 text-slate-300">Pass a quiz with {PASS_PERCENT}% or more and your certificate is generated automatically.</p>
      <ul className="glass mb-4 space-y-3 p-5">
        <Row ok={c.passed} text={c.quiz ? `Quiz passed (score ${c.quiz.score} / 100, need ${PASS_PERCENT})` : `Pass a quiz (${PASS_PERCENT} out of 100)`} to="/quiz" />
        <Row ok={c.profileOk} text="Name, school and class added in your profile" to="/profile" />
      </ul>
      {ready && c.quiz && (
        <div className="mb-4 rounded-2xl border-4 border-violet-500 bg-white p-4 text-center text-slate-800 sm:p-6">
          <p className="text-xl font-extrabold text-violet-800">Embedded IoT-Simulator</p>
          <p className="font-semibold text-blue-700">Certificate of Completion</p>
          <p className="mt-3 text-sm">This is to certify that</p>
          <p className="break-words text-2xl font-bold italic sm:text-3xl">{c.name}</p>
          <p className="mt-2 text-sm">of {c.school}, Class {c.cls}, scored {c.quiz.score} / 100 · {c.date}</p>
          <p className="mt-2 text-xs text-slate-500">ID: {c.certificateId}</p>
        </div>
      )}
      <button className="btn-primary" disabled={!ready || c.status === 'working'} onClick={() => void c.regenerate()}><Download size={16} />{c.downloaded ? 'Download certificate again' : 'Download PDF certificate'}</button>
      {c.status === 'error' && <p className="mt-2 text-sm text-red-300">Sorry, the certificate could not be created. Please try again.</p>}
      {c.downloaded && c.status !== 'error' && <p className="mt-2 text-sm text-emerald-300">Your certificate was generated automatically.</p>}
    </div>
  );
}
