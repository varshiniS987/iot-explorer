import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearAdminToken, clearToken } from '../services/api';

interface StudentSession { name: string; email: string }
interface AdminSession { email: string }
export type Role = 'student' | 'admin';

interface AuthState {
  student: StudentSession | null;
  admin: AdminSession | null;
  lastStudentEmail: string;            // used to avoid mixing two students' local progress on a shared computer
  loginStudent: (s: StudentSession) => void;
  loginAdmin: (a: AdminSession) => void;
  logout: (role: Role) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      student: null, admin: null, lastStudentEmail: '',
      loginStudent: (student) => set({ student, lastStudentEmail: student.email }),
      loginAdmin: (admin) => set({ admin }),
      logout: (role) => {
        if (role === 'admin') { clearAdminToken(); set({ admin: null }); }
        else { clearToken(); set({ student: null }); }
      },
    }),
    { name: 'iot-auth', version: 1 }
  )
);

// A rejected token (expired / replaced by a newer login) signs that portal out.
if (typeof window !== 'undefined') {
  window.addEventListener('iot-auth-expired', (e) => useAuth.getState().logout((e as CustomEvent<Role>).detail));
}
