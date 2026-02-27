'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewMode } from '@/types';
import type { DiagramTheme } from '@/types';

type UIContextValue = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  theme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  isPublishModalOpen: boolean;
  setIsPublishModalOpen: (open: boolean) => void;
  isImageImportModalOpen: boolean;
  setIsImageImportModalOpen: (open: boolean) => void;
  isAuditModalOpen: boolean;
  setIsAuditModalOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  isPublishPromptModalOpen: boolean;
  setIsPublishPromptModalOpen: (open: boolean) => void;
  isAIChatExpanded: boolean;
  setIsAIChatExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<DiagramTheme>('dark');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPublishPromptModalOpen, setIsPublishPromptModalOpen] = useState(false);
  const [isAIChatExpanded, setIsAIChatExpanded] = useState(true);

  // Responsive layout — collapse sidebar + switch to preview on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode(ViewMode.Preview);
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <UIContext.Provider
      value={{
        viewMode,
        setViewMode,
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        theme,
        setTheme,
        isPublishModalOpen,
        setIsPublishModalOpen,
        isImageImportModalOpen,
        setIsImageImportModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isShortcutsModalOpen,
        setIsShortcutsModalOpen,
        isPublishPromptModalOpen,
        setIsPublishPromptModalOpen,
        isAIChatExpanded,
        setIsAIChatExpanded,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
