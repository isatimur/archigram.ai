'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

const ProfilePage = lazy(() => import('@/components/ProfilePage'));

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function ProfileRoute() {
  const { user, handleSignOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      // Redirect unauthenticated users to landing
      router.replace('/');
    }
  }, [user, router]);

  if (!user) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProfilePage
        user={user}
        projects={[]}
        onSignOut={async () => {
          await handleSignOut();
          router.replace('/');
        }}
        onOpenDiagram={() => router.push('/editor')}
        onDeleteProject={() => {}}
      />
    </Suspense>
  );
}
