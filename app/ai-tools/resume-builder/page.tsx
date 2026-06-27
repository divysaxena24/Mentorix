'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy LaTeX resume builder page – replaced with redirect to the new JSON‑based builder.
 * This prevents 404 errors from the removed `/api/latex/compile` endpoint.
 */
export default function ResumeBuilderRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new JSON‑based resume builder page
    router.replace('/dashboard/resume-builder');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <p className="text-gray-600">Redirecting to the new Resume Builder…</p>
    </div>
  );
}
