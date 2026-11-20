import { createContext, useContext } from 'react';
export const SimContext = createContext({
  basePath: '/simulation', quizRoute: '/quiz/:projectId', studentName: 'Student', onContinueToQuiz: null,
});
export const useSim = () => useContext(SimContext);
