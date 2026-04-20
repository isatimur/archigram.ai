'use client';

import { FolderOpen, LayoutTemplate, Globe, Sparkles } from 'lucide-react';
import type { ActivePanel } from '@/lib/contexts/UIContext';

type ActivityBarProps = {
  activePanel: ActivePanel;
  onPanelToggle: (panel: Exclude<ActivePanel, null>) => void;
  onOpenCopilot: () => void;
};

const TOP_ITEMS = [
  { id: 'projects' as const, icon: FolderOpen, label: 'Projects' },
  { id: 'templates' as const, icon: LayoutTemplate, label: 'Templates' },
  { id: 'community' as const, icon: Globe, label: 'Community' },
] as const;

export default function ActivityBar({
  activePanel,
  onPanelToggle,
  onOpenCopilot,
}: ActivityBarProps) {
  return (
    <div
      className="w-12 h-full flex flex-col items-center py-1 bg-surface border-r border-border shrink-0"
      role="navigation"
      aria-label="Activity bar"
    >
      {/* Top: panel toggles */}
      <div className="flex-1 flex flex-col items-center gap-0.5 pt-1">
        {TOP_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activePanel === id;
          return (
            <button
              key={id}
              title={label}
              aria-label={label}
              aria-pressed={isActive}
              onClick={() => onPanelToggle(id)}
              className={`
                relative w-10 h-10 flex items-center justify-center rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                ${
                  isActive
                    ? 'text-primary bg-primary-bg'
                    : 'text-text-dim hover:text-text-muted hover:bg-surface-hover'
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" />
              )}
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Bottom: copilot */}
      <div className="flex flex-col items-center gap-0.5 pb-2">
        <button
          title="AI Copilot"
          aria-label="Open AI Copilot"
          onClick={onOpenCopilot}
          className="w-10 h-10 flex items-center justify-center rounded-md text-text-dim hover:text-text-muted hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
