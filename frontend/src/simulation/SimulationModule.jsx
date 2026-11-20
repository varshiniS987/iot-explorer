import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/simulation.css';
import ProjectSelection from './pages/ProjectSelection.jsx';
import GuidedSimulation from './pages/GuidedSimulation.jsx';
import IndependentSimulation from './pages/IndependentSimulation.jsx';
import Completion from './pages/Completion.jsx';
import { configure } from './utils/progressStorage.js';
import { SimContext } from './utils/simContext.js';

/**
 * Mount under a route ending in /*, e.g. <Route path="/simulation/*" element={<SimulationModule .../>} />
 * Props: studentId, studentName, onProjectComplete(record), onContinueToQuiz(record),
 *        quizRoute ('/quiz/:projectId'), basePath ('/simulation' – must match the parent route).
 */
export default function SimulationModule({ studentId, studentName = 'Student', onProjectComplete, onContinueToQuiz, quizRoute = '/quiz/:projectId', basePath = '/simulation' }) {
  configure({ studentId, onProjectComplete });
  const ctx = useMemo(() => ({ basePath, quizRoute, studentName, onContinueToQuiz }), [basePath, quizRoute, studentName, onContinueToQuiz]);
  return (
    <SimContext.Provider value={ctx}>
      <div className="sim-root">
      <Routes>
        <Route index element={<ProjectSelection />} />
        <Route path="guided/:id" element={<GuidedSimulation />} />
        <Route path="independent/:id" element={<IndependentSimulation />} />
        <Route path="complete/:id" element={<Completion />} />
        <Route path="*" element={<Navigate to={basePath} replace />} />
      </Routes>
      </div>
    </SimContext.Provider>
  );
}
