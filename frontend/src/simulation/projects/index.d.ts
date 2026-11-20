export interface SimProjectInfo {
  id: string; no: number; name: string; category: string; difficulty: string;
  description: string; objective: string;
}
export const PROJECTS: SimProjectInfo[];
export function getProject(id: string): SimProjectInfo | undefined;
