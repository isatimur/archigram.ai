'use client';

import dynamic from 'next/dynamic';

// Exclude the entire editor (providers + shell) from SSR.
// supabaseClient.ts creates a client at module level which crashes if URL is empty.
const EditorWithProviders = dynamic(() => import('@/app/_components/EditorWithProviders'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-zinc-500 font-mono animate-pulse">Loading ArchiGram...</p>
      </div>
    </div>
  ),
});

export default function EditorPage() {
  return <EditorWithProviders />;
}
