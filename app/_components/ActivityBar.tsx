'use client';

import React from 'react';
import { PanelLeft, Bot, Keyboard } from 'lucide-react';
import { useUI } from '@/lib/contexts/UIContext';

export default function ActivityBar() {
  const { activePanel, setActivePanel, isCopilotOpen, setIsCopilotOpen, setIsShortcutsModalOpen } =
    useUI();

  const isSidebarOpen = activePanel !== null;

  const toggleSidebar = () => {
    setActivePanel(isSidebarOpen ? null : 'projects');
  };

  return (
    <aside
      className="w-12 shrink-0 h-full bg-surface border-r border-border flex flex-col items-center py-2 z-20"
      aria-label="Activity bar"
    >
      {/* Top: sidebar toggle */}
      <div className="flex flex-col items-center gap-1 flex-1">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          aria-pressed={isSidebarOpen}
          title="Toggle sidebar (⌘B)"
          className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            isSidebarOpen
              ? 'text-primary bg-primary/10'
              : 'text-text-muted hover:text-text hover:bg-surface-hover'
          }`}
        >
          {isSidebarOpen && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
          )}
          <PanelLeft className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Bottom: copilot + shortcuts */}
      <div className="flex flex-col items-center gap-1 pb-1">
        <div className="w-6 h-px bg-border/60 mb-1" />

        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          aria-label="Toggle AI Copilot"
          aria-pressed={isCopilotOpen}
          title="AI Copilot (⌘⇧C)"
          className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            isCopilotOpen
              ? 'text-primary bg-primary/10'
              : 'text-text-muted hover:text-text hover:bg-surface-hover'
          }`}
        >
          {isCopilotOpen && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
          )}
          <Bot className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={() => setIsShortcutsModalOpen(true)}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
