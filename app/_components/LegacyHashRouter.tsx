'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Renders null — included in root layout to redirect old hash-based bookmarks.
 * e.g. /#gallery → /gallery, /#app → /editor
 *
 * Note: diagram share hashes (e.g. #N3JaA8o...) are NOT in HASH_MAP,
 * so they pass through unmodified and are handled by the editor.
 */

const HASH_MAP: Record<string, string> = {
  '#app': '/editor',
  '#gallery': '/gallery',
  '#docs': '/docs',
  '#discover': '/discover',
  '#prompts': '/prompts',
  '#faq': '/faq',
  '#privacy': '/privacy',
  '#terms': '/terms',
  '#license': '/license',
  '#profile': '/profile',
  '#landing': '/',
  '#plantuml': '/plantuml',
};

export function LegacyHashRouter() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const destination = HASH_MAP[hash];
    if (destination) {
      router.replace(destination);
    }
  }, [router]);

  return null;
}
