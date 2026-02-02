// Analytics utility for Plausible custom events

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export const trackEvent = (eventName: string, props?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props });
  }
};

// Predefined event trackers
export const analytics = {
  // Diagram generation
  diagramGenerated: (diagramType?: string) => {
    trackEvent('Diagram Generated', { type: diagramType || 'unknown' });
  },

  // Export actions
  exportPng: () => {
    trackEvent('Export PNG');
  },

  exportSvg: () => {
    trackEvent('Export SVG');
  },

  // Community actions
  diagramPublished: (tags?: string[]) => {
    trackEvent('Diagram Published', {
      tagCount: tags?.length || 0,
    });
  },

  diagramForked: () => {
    trackEvent('Diagram Forked');
  },

  diagramLiked: () => {
    trackEvent('Diagram Liked');
  },

  // Feature usage
  commandPaletteOpened: () => {
    trackEvent('Command Palette Opened');
  },

  aiChatToggled: (action: 'open' | 'close') => {
    trackEvent('AI Chat Toggled', { action });
  },

  visionAiUsed: () => {
    trackEvent('Vision AI Used');
  },

  auditRun: () => {
    trackEvent('Architectural Audit Run');
  },

  // Navigation
  viewChanged: (view: string) => {
    trackEvent('View Changed', { view });
  },

  // Project actions
  projectCreated: () => {
    trackEvent('Project Created');
  },

  projectDuplicated: () => {
    trackEvent('Project Duplicated');
  },

  projectDeleted: () => {
    trackEvent('Project Deleted');
  },

  // Template usage
  templateUsed: (templateName: string) => {
    trackEvent('Template Used', { template: templateName });
  },

  // Keyboard shortcuts
  shortcutUsed: (shortcut: string) => {
    trackEvent('Shortcut Used', { shortcut });
  },
};
