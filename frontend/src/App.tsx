import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Lab from './pages/Lab';
import Challenges from './pages/Challenges';
import Quiz from './pages/Quiz';
import QuizResults from './pages/QuizResults';
import Feedback from './pages/Feedback';
import Certificate from './pages/Certificate';
import Dashboard from './pages/Dashboard';
import Academy from './pages/Academy';
import Events from './pages/Events';
import EventRegister from './pages/EventRegister';
import CircuitGame from './pages/CircuitGame';
import PartMatch from './pages/PartMatch';
import Backdrop3D from './components/ui/Backdrop3D';
import TopicCourse from './pages/TopicCourse';
import SimulationLab from './pages/SimulationLab';

const Explore3D = lazy(() => import('./pages/Explore3D'));

export default function App() {
  return (
    <div className="app7">
      <Backdrop3D />
      <Navbar />
      <main>
        <Suspense fallback={<p className="p-8 text-center text-slate-300">Loading…</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore3D />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/results" element={<QuizResults />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/academy/:id" element={<TopicCourse />} />
          <Route path="/simulator/*" element={<SimulationLab />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/register" element={<EventRegister />} />
          <Route path="/circuit-game" element={<CircuitGame />} />
          <Route path="/game" element={<PartMatch />} />
          <Route path="*" element={<Home />} />
        </Routes>
        </Suspense>
      </main>
    </div>
  );
}
