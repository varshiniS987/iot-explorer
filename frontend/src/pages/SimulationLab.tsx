import { useCallback, useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import SimulationModule from '../simulation/SimulationModule.jsx';
import type { SimProgressRecord } from '../simulation/SimulationModule';
import { getAllProgress } from '../simulation/utils/progressStorage.js';
import { useAppStore } from '../store/useAppStore';
import { api, getToken } from '../services/api';

/** Single local student profile for the simulation module's own progress records. */
const SIM_STUDENT_ID = 'iot-explorer-student';

/**
 * Embedded IoT simulation phase (17 Arduino UNO projects), mounted at /simulator/*.
 * Flow per project: guided walkthrough -> independent wiring + validation -> completion -> quiz.
 * A completed project is recorded in the app store (dashboard, XP, badges) and, when the
 * student is registered with the backend, saved via PUT /api/me/sims/:simId.
 */
export default function SimulationLab() {
  const completeSim = useAppStore((s) => s.completeSim);
  const studentName = useAppStore((s) => s.studentName);

  const onProjectComplete = useCallback((r: SimProgressRecord) => {
    completeSim(r.projectId);
    if (getToken()) api.completeSim(r.projectId).catch(() => { /* offline: local progress is kept */ });
  }, [completeSim]);

  // Back-fill: projects finished earlier still count on the dashboard.
  useEffect(() => {
    Object.values(getAllProgress(SIM_STUDENT_ID)).forEach((r) => { if (r.status === 'completed') completeSim(r.projectId); });
  }, [completeSim]);

  return (
    <MotionConfig reducedMotion="user">
      <SimulationModule
        studentId={SIM_STUDENT_ID}
        studentName={studentName || 'Student'}
        basePath="/simulator"
        quizRoute="/quiz"
        onProjectComplete={onProjectComplete}
      />
    </MotionConfig>
  );
}
