'use client';

import { UIProvider } from '@/lib/contexts/UIContext';
import { EditorProvider } from '@/lib/contexts/EditorContext';
import EditorShell from './EditorShell';

/**
 * Bundles UI + Editor providers with EditorShell.
 * Loaded via next/dynamic({ ssr: false }) so that supabaseClient.ts
 * (which creates a client at module level) never runs server-side.
 */
export default function EditorWithProviders() {
  return (
    <UIProvider>
      <EditorProvider>
        <EditorShell />
      </EditorProvider>
    </UIProvider>
  );
}
