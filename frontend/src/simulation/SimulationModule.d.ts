import type { ComponentType } from 'react';

export interface SimProgressRecord {
  studentId: string; projectId: string; projectName: string;
  guidedCompleted: boolean; independentCompleted: boolean;
  attempts: number; hintsUsed: number; connectionAccuracy: number;
  validationPassed: boolean; testResults: unknown[];
  status: 'in-progress' | 'completed'; completedAt: string | null;
}
export interface SimulationModuleProps {
  studentId?: string;
  studentName?: string;
  basePath?: string;
  quizRoute?: string;
  onProjectComplete?: (record: SimProgressRecord) => void;
  onContinueToQuiz?: (record: SimProgressRecord) => void;
}
declare const SimulationModule: ComponentType<SimulationModuleProps>;
export default SimulationModule;
