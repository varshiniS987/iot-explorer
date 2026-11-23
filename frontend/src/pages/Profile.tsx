import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useProgress } from '../hooks/useProgress';

export default function Profile() {
  const { s, avatar } = useProgress();
  const bestGame = Object.entries(s.gameBest);

  return (
    <div className="page7 dash7">
      <section className="panel7 profile7">
        <div className="profile7-head">
          <div className="dash-avatar">{avatar}</div>
          <div>
            <h1 className="dash-h sm">My profile</h1>
            <p className="dash-sub">Your details are used on your certificate.</p>
          </div>
        </div>
        <label className="pf">Name<input className="form-field" value={s.studentName} onChange={(e) => s.setStudent({ studentName: e.target.value })} placeholder="Your name" maxLength={80} /></label>
        <label className="pf">School<input className="form-field" value={s.schoolName} onChange={(e) => s.setStudent({ schoolName: e.target.value })} placeholder="Your school" maxLength={120} /></label>
        <label className="pf">Class<input className="form-field" value={s.className} onChange={(e) => s.setStudent({ className: e.target.value })} placeholder="e.g. 9" maxLength={10} /></label>
        <ul className="pf-list">
          <li><span>Final quiz</span><b>{s.quiz ? `${s.quiz.score} / ${s.quiz.total} (${s.quiz.passed ? 'passed' : 'not passed yet'})` : 'Not taken'}</b></li>
          <li><span>Feedback</span><b>{s.feedback ? 'Submitted' : 'Pending'}</b></li>
          <li><span>Certificate</span><b>{s.certificateId ? `Generated ${s.certificateId}` : 'Not yet generated'}</b></li>
          {bestGame.map(([id, g]) => <li key={id}><span>Part Match · {id}</span><b>{'★'.repeat(g.stars)} {g.score} pts</b></li>)}
        </ul>
        <div className="pf-actions">
          <Link to="/certificate" className="btn7 btn7-sun sm">Certificate</Link>
          <Link to="/feedback" className="btn7 btn7-glass sm">Feedback</Link>
          <button className="btn7 btn7-glass sm" onClick={() => { if (confirm('Clear all saved progress on this device?')) useAppStore.getState().resetAll(); }}>Reset progress</button>
        </div>
      </section>
    </div>
  );
}
