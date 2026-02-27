'use client';

import { Suspense, lazy } from 'react';
import { useAppNavigate } from '../_components/NavigationAdapter';

const FAQPage = lazy(() => import('@/components/FAQPage'));

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function FaqPage() {
  const navigate = useAppNavigate();
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FAQPage onNavigate={navigate} />
    </Suspense>
  );
}
