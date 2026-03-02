'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-2xl font-bold text-[rgb(228,228,231)]">Something went wrong</h1>
      <p className="mt-2 text-[rgb(161,161,170)]">Failed to load this profile. Please try again.</p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg bg-[rgb(99,102,241)] hover:bg-[rgb(79,70,229)] text-white text-sm font-medium transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg border border-[rgb(63,63,70)] text-[rgb(161,161,170)] hover:text-[rgb(228,228,231)] text-sm font-medium transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
