/**
 * Tests for analytics utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('analytics', () => {
  let plausibleMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    plausibleMock = vi.fn();
    (global as any).window = { plausible: plausibleMock };
  });

  afterEach(() => {
    delete (global as any).window;
    vi.resetModules();
  });

  describe('trackEvent', () => {
    it('should call window.plausible when available', async () => {
      const { trackEvent } = await import('../../utils/analytics.ts');
      trackEvent('Test Event', { key: 'value' });
      expect(plausibleMock).toHaveBeenCalledWith('Test Event', { props: { key: 'value' } });
    });

    it('should not throw when window.plausible is missing', async () => {
      delete (global as any).window.plausible;
      const { trackEvent } = await import('../../utils/analytics.ts');
      expect(() => trackEvent('Test')).not.toThrow();
    });
  });

  describe('analytics helpers', () => {
    it('diagramGenerated should track with type', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.diagramGenerated('flowchart');
      expect(plausibleMock).toHaveBeenCalledWith('Diagram Generated', {
        props: { type: 'flowchart' },
      });
    });

    it('diagramGenerated should use unknown when type omitted', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.diagramGenerated();
      expect(plausibleMock).toHaveBeenCalledWith('Diagram Generated', {
        props: { type: 'unknown' },
      });
    });

    it('exportPng should track Export PNG', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.exportPng();
      expect(plausibleMock).toHaveBeenCalledWith('Export PNG', { props: undefined });
    });

    it('diagramPublished should track with tag count', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.diagramPublished(['a', 'b']);
      expect(plausibleMock).toHaveBeenCalledWith('Diagram Published', { props: { tagCount: 2 } });
    });

    it('aiChatToggled should track action', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.aiChatToggled('open');
      expect(plausibleMock).toHaveBeenCalledWith('AI Chat Toggled', { props: { action: 'open' } });
    });

    it('templateUsed should track template name', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.templateUsed('C4 Context');
      expect(plausibleMock).toHaveBeenCalledWith('Template Used', {
        props: { template: 'C4 Context' },
      });
    });

    it('shortcutUsed should track shortcut', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.shortcutUsed('Ctrl+S');
      expect(plausibleMock).toHaveBeenCalledWith('Shortcut Used', {
        props: { shortcut: 'Ctrl+S' },
      });
    });

    it('exportSvg should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.exportSvg();
      expect(plausibleMock).toHaveBeenCalledWith('Export SVG', { props: undefined });
    });

    it('diagramForked should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.diagramForked();
      expect(plausibleMock).toHaveBeenCalledWith('Diagram Forked', { props: undefined });
    });

    it('diagramLiked should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.diagramLiked();
      expect(plausibleMock).toHaveBeenCalledWith('Diagram Liked', { props: undefined });
    });

    it('commandPaletteOpened should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.commandPaletteOpened();
      expect(plausibleMock).toHaveBeenCalledWith('Command Palette Opened', { props: undefined });
    });

    it('visionAiUsed should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.visionAiUsed();
      expect(plausibleMock).toHaveBeenCalledWith('Vision AI Used', { props: undefined });
    });

    it('auditRun should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.auditRun();
      expect(plausibleMock).toHaveBeenCalledWith('Architectural Audit Run', { props: undefined });
    });

    it('viewChanged should track view', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.viewChanged('gallery');
      expect(plausibleMock).toHaveBeenCalledWith('View Changed', { props: { view: 'gallery' } });
    });

    it('projectCreated should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.projectCreated();
      expect(plausibleMock).toHaveBeenCalledWith('Project Created', { props: undefined });
    });

    it('projectDuplicated should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.projectDuplicated();
      expect(plausibleMock).toHaveBeenCalledWith('Project Duplicated', { props: undefined });
    });

    it('projectDeleted should track', async () => {
      const { analytics } = await import('../../utils/analytics.ts');
      analytics.projectDeleted();
      expect(plausibleMock).toHaveBeenCalledWith('Project Deleted', { props: undefined });
    });
  });
});
