'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppNavigate } from '../_components/NavigationAdapter';
import type { CommunityDiagram } from '@/types';
import { encodeCodeToUrl } from '@/utils/url';

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const DiscoverPage = dynamic(() => import('@/components/DiscoverPage'), {
  ssr: false,
  loading: LoadingScreen,
});

export default function Discover() {
  const navigate = useAppNavigate();
  const router = useRouter();

  const handleFork = (diagram: CommunityDiagram) => {
    const encoded = encodeCodeToUrl(diagram.code);
    router.push(`/editor${encoded ? `#${encoded}` : ''}`);
  };

  return <DiscoverPage onNavigate={navigate} onFork={handleFork} />;
}
