'use client';

import type { ReactNode } from 'react';
import { UIProvider } from '@/lib/contexts/UIContext';
import { EditorProvider } from '@/lib/contexts/EditorContext';

/**
 * Editor-specific providers: UI state + project state.
 * AuthProvider lives in the root layout so all pages share auth.
 */
export function EditorProviders({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <EditorProvider>{children}</EditorProvider>
    </UIProvider>
  );
}
