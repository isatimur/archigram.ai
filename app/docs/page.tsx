'use client';

import { Suspense, lazy } from 'react';
import { useAppNavigate } from '../_components/NavigationAdapter';

const Documentation = lazy(() => import('@/components/Documentation'));

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function DocsPage() {
  const navigate = useAppNavigate();
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Documentation onNavigate={navigate} />
    </Suspense>
  );
}
