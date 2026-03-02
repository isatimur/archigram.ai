'use client';

import { Suspense, lazy } from 'react';
import { useAppNavigate } from '../_components/NavigationAdapter';

const LegalPage = lazy(() => import('@/components/LegalPage'));

export default function LicensePage() {
  const navigate = useAppNavigate();
  return (
    <Suspense fallback={null}>
      <LegalPage type="license" onNavigate={navigate} />
    </Suspense>
  );
}
