'use client';

import dynamic from 'next/dynamic';

const EmbedView = dynamic(() => import('@/components/EmbedView'), { ssr: false });

export default function EmbedPage() {
  return <EmbedView />;
}
