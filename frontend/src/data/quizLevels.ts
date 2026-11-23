export type QuizLevel = 'beginner' | 'intermediate' | 'advanced';
export const QUESTIONS_PER_LEVEL = 25;
export const PASS_PERCENT = 60;
export const QUIZ_LEVELS: Record<QuizLevel, { title: string; description: string; indices: number[]; duration: string }> = {
  beginner: { title: "Beginner", description: "Basic components, names and simple concepts.", indices: [0, 2, 3, 5, 7, 8, 13, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37], duration: "15–20 min" },
  intermediate: { title: "Intermediate", description: "Connections, readings, practical use and troubleshooting.", indices: [1, 4, 6, 9, 11, 18, 19, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55], duration: "20–25 min" },
  advanced: { title: "Advanced", description: "Calculations, communication, system design and safety.", indices: [10, 12, 14, 15, 16, 17, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74], duration: "25–30 min" },
};