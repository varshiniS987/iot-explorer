import type { SimProgressRecord } from '../SimulationModule';

export function configure(o: { studentId?: string | null; onProjectComplete?: ((r: SimProgressRecord) => void) | null }): void;
export function getStudentId(): string;
export function getProgress(projectId: string, sid?: string): SimProgressRecord | null;
export function getAllProgress(sid?: string): Record<string, SimProgressRecord>;
export function clearProgress(): void;
