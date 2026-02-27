'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppNavigate } from '../_components/NavigationAdapter';

const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PromptMarketplace = dynamic(() => import('@/components/PromptMarketplace'), {
  ssr: false,
  loading: LoadingScreen,
});

export default function PromptsPage() {
  const navigate = useAppNavigate();
  const router = useRouter();

  const handleTryPrompt = (_promptText: string, _domain: string, resultCode?: string) => {
    if (resultCode) {
      import('@/utils/url').then(({ encodeCodeToUrl }) => {
        const encoded = encodeCodeToUrl(resultCode);
        router.push(`/editor${encoded ? `#${encoded}` : ''}`);
      });
    } else {
      router.push('/editor');
    }
  };

  return (
    <PromptMarketplace
      onNavigate={navigate}
      onTryPrompt={handleTryPrompt}
      onRequireAuth={() => router.push('/editor')}
    />
  );
}
