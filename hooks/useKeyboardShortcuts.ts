import { useEffect } from 'react';
import { toast } from 'sonner';
import { analytics } from '../utils/analytics.ts';
import { AppView } from '../types.ts';

interface UseKeyboardShortcutsOptions {
  currentView: AppView;
  isPublishModalOpen: boolean;
  isImageImportModalOpen: boolean;
  isAuditModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  isShortcutsModalOpen: boolean;
  setCurrentView: (view: AppView) => void;
  setIsAIChatExpanded: (fn: (prev: boolean) => boolean) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsPublishModalOpen: (open: boolean) => void;
  setIsImageImportModalOpen: (open: boolean) => void;
  setIsAuditModalOpen: (open: boolean) => void;
  setIsShortcutsModalOpen: (open: boolean) => void;
  handleCreateProject: () => void;
  handleExportPng: () => void;
  handleExportSvg: () => void;
  handleDuplicateDiagram: () => void;
  handleShare: () => void;
  openPublishModal: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const {
    currentView,
    isPublishModalOpen,
    isImageImportModalOpen,
    isAuditModalOpen,
    isCommandPaletteOpen,
    isShortcutsModalOpen,
    setCurrentView,
    setIsAIChatExpanded,
    setIsCommandPaletteOpen,
    setIsPublishModalOpen,
    setIsImageImportModalOpen,
    setIsAuditModalOpen,
    setIsShortcutsModalOpen,
    handleCreateProject,
    handleExportPng,
    handleExportSvg,
    handleDuplicateDiagram,
    handleShare,
    openPublishModal,
  } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        isPublishModalOpen ||
        isImageImportModalOpen ||
        isAuditModalOpen ||
        isCommandPaletteOpen
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        toast.success('Saved automatically');
        return;
      }

      if (modKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleShare();
        return;
      }

      if (modKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleCreateProject();
        return;
      }

      if (modKey && e.key === 'e' && !e.shiftKey) {
        e.preventDefault();
        handleExportPng();
        return;
      }

      if (modKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        handleExportSvg();
        return;
      }

      if (modKey && e.key === '/') {
        e.preventDefault();
        setIsAIChatExpanded((prev) => {
          analytics.aiChatToggled(prev ? 'close' : 'open');
          return !prev;
        });
        return;
      }

      if (modKey && e.key === 'k') {
        e.preventDefault();
        analytics.commandPaletteOpened();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (modKey && e.key === 'g' && !e.shiftKey) {
        e.preventDefault();
        const newView = currentView === 'gallery' ? 'app' : 'gallery';
        analytics.viewChanged(newView);
        setCurrentView(newView);
        return;
      }

      if (modKey && e.key === 'd' && !e.shiftKey) {
        e.preventDefault();
        handleDuplicateDiagram();
        return;
      }

      if (modKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        openPublishModal();
        return;
      }

      if (e.key === '?' && !modKey) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          e.preventDefault();
        } else if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          e.preventDefault();
        } else if (isPublishModalOpen) {
          setIsPublishModalOpen(false);
          e.preventDefault();
        } else if (isImageImportModalOpen) {
          setIsImageImportModalOpen(false);
          e.preventDefault();
        } else if (isAuditModalOpen) {
          setIsAuditModalOpen(false);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentView,
    isPublishModalOpen,
    isImageImportModalOpen,
    isAuditModalOpen,
    isCommandPaletteOpen,
    isShortcutsModalOpen,
    setCurrentView,
    setIsAIChatExpanded,
    setIsCommandPaletteOpen,
    setIsPublishModalOpen,
    setIsImageImportModalOpen,
    setIsAuditModalOpen,
    setIsShortcutsModalOpen,
    handleCreateProject,
    handleExportPng,
    handleExportSvg,
    handleDuplicateDiagram,
    handleShare,
    openPublishModal,
  ]);
}
