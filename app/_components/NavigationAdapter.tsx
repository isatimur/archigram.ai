'use client';

import { useRouter } from 'next/navigation';
import type { AppView } from '@/types';

export const VIEW_TO_PATH: Record<AppView, string> = {
  landing: '/',
  app: '/editor',
  plantuml: '/plantuml',
  docs: '/docs',
  gallery: '/gallery',
  discover: '/discover',
  prompts: '/prompts',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  license: '/license',
  profile: '/profile',
};

/**
 * Returns a navigation function that maps AppView identifiers to Next.js routes.
 * Drop-in replacement for the setCurrentView prop that was threaded through App.tsx.
 */
export function useAppNavigate() {
  const router = useRouter();
  return (view: AppView) => router.push(VIEW_TO_PATH[view]);
}
