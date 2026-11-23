import { useCallback, useEffect, useRef, useState } from 'react';
import { generateCertificate } from '../components/certificate/generateCertificate';
import { useAppStore } from '../store/useAppStore';

/**
 * Certificate rules: pass a level quiz with 60% or more and the certificate is created automatically
 * (an ID is issued at once, and the PDF is generated as soon as name, school and class are known).
 */
export function useAutoCertificate() {
  const quiz = useAppStore((s) => s.quiz);
  const name = useAppStore((s) => s.studentName);
  const school = useAppStore((s) => s.schoolName);
  const cls = useAppStore((s) => s.className);
  const certificateId = useAppStore((s) => s.certificateId);
  const downloaded = useAppStore((s) => s.certificateDownloaded);
  const issueCertificate = useAppStore((s) => s.issueCertificate);
  const markDownloaded = useAppStore((s) => s.markCertificateDownloaded);

  const passed = !!quiz?.passed;
  const profileOk = name.trim().length >= 2 && school.trim().length >= 2 && cls.trim().length >= 1;
  const date = quiz ? new Date(quiz.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const busy = useRef(false);

  const make = useCallback(async () => {
    if (!quiz || !passed || !profileOk || busy.current) return false;
    busy.current = true; setStatus('working');
    try {
      const id = issueCertificate();
      await generateCertificate({ name: name.trim(), school: school.trim(), cls: cls.trim(), score: quiz.score, date, id });
      markDownloaded(); setStatus('idle'); return true;
    } catch { setStatus('error'); return false; }
    finally { busy.current = false; }
  }, [quiz, passed, profileOk, name, school, cls, date, issueCertificate, markDownloaded]);

  useEffect(() => { if (passed) issueCertificate(); }, [passed, issueCertificate]);
  useEffect(() => { if (passed && profileOk && !downloaded) void make(); }, [passed, profileOk, downloaded, make]);

  return { quiz, passed, profileOk, certificateId, downloaded, status, date, name, school, cls, regenerate: make };
}
