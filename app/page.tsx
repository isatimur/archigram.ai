'use client';

import { Suspense, lazy } from 'react';
import { useAppNavigate } from './_components/NavigationAdapter';

const LandingPage = lazy(() => import('@/components/LandingPage'));

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-zinc-500 font-mono animate-pulse">Loading ArchiGram...</p>
    </div>
  </div>
);

export default function HomePage() {
  const navigate = useAppNavigate();
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LandingPage onNavigate={navigate} />
    </Suspense>
  );
}
