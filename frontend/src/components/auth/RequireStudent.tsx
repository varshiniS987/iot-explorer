import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../../services/api';
import { useAuth } from '../../store/useAuth';

/** Used only when REQUIRE_STUDENT_LOGIN is true (src/config/auth.ts). */
export default function RequireStudent({ children }: { children: ReactNode }) {
  const student = useAuth((s) => s.student);
  const loc = useLocation();
  if (!student || !getToken()) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}
