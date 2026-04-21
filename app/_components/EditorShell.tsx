'use client';

import React, { useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useUI } from '@/lib/contexts/UIContext';
import { useEditor } from '@/lib/contexts/EditorContext';
import { VIEW_TO_PATH } from '@/app/_components/NavigationAdapter';
import { ViewMode } from '@/types';
import type { DiagramTheme, AppView } from '@/types';
import { encodeCodeToUrl } from '@/utils/url';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSplitPane } from '@/hooks/useSplitPane';
import { useExportHandlers } from '@/hooks/useExportHandlers';
import { usePublishFlow } from '@/hooks/usePublishFlow';

const CommandBar = lazy(() => import('@/components/CommandBar'));
const LeftPanel = lazy(() => import('@/components/LeftPanel'));
const CopilotPanel = lazy(() => import('@/components/CopilotPanel'));
const ModalRenderer = lazy(() => import('@/components/ModalRenderer'));
const CodeEditor = lazy(() => import('@/components/CodeEditor'));
const DiagramPreview = lazy(() => import('@/components/DiagramPreview'));

type ThemeVars = React.CSSProperties & Record<`--${string}`, string>;

const THEMES: Record<DiagramTheme, ThemeVars> = {
  // Obsidian — void black with electric indigo
  dark: {
    '--bg': '9 9 11',
    '--surface': '17 17 20',
    '--surface-hover': '26 26 30',
    '--surface-elevated': '35 35 42',
    '--border': '44 44 52',
    '--text': '230 230 235',
    '--text-muted': '110 110 122',
    '--text-dim': '58 58 68',
    '--primary': '129 140 248',
    '--primary-hover': '99 102 241',
    '--primary-bg': '28 28 62',
    '--accent': '196 130 249',
  },
  // Abyss — deep ocean with electric cyan
  midnight: {
    '--bg': '3 7 18',
    '--surface': '8 16 36',
    '--surface-hover': '14 28 55',
    '--surface-elevated': '20 38 70',
    '--border': '28 52 90',
    '--text': '240 248 255',
    '--text-muted': '138 158 180',
    '--text-dim': '55 75 105',
    '--primary': '34 211 238',
    '--primary-hover': '6 182 212',
    '--primary-bg': '8 28 58',
    '--accent': '244 114 182',
  },
  // Phosphor — terminal green on near-void
  forest: {
    '--bg': '4 10 4',
    '--surface': '7 20 8',
    '--surface-hover': '10 33 12',
    '--surface-elevated': '14 45 16',
    '--border': '18 58 22',
    '--text': '220 252 231',
    '--text-muted': '74 222 128',
    '--text-dim': '20 64 24',
    '--primary': '74 222 128',
    '--primary-hover': '34 197 94',
    '--primary-bg': '4 40 12',
    '--accent': '253 224 71',
  },
  // Arctic — crisp white with cobalt precision
  neutral: {
    '--bg': '255 255 255',
    '--surface': '245 247 250',
    '--surface-hover': '233 237 244',
    '--surface-elevated': '220 228 240',
    '--border': '204 214 228',
    '--text': '10 15 30',
    '--text-muted': '88 108 136',
    '--text-dim': '150 170 195',
    '--primary': '37 99 235',
    '--primary-hover': '29 78 216',
    '--primary-bg': '214 232 255',
    '--accent': '248 113 113',
  },
  // Ember — warm charcoal with amber fire
  ember: {
    '--bg': '12 8 6',
    '--surface': '22 15 10',
    '--surface-hover': '34 22 14',
    '--surface-elevated': '46 30 18',
    '--border': '60 38 22',
    '--text': '255 237 213',
    '--text-muted': '180 128 80',
    '--text-dim': '80 50 28',
    '--primary': '251 146 60',
    '--primary-hover': '234 88 12',
    '--primary-bg': '48 24 8',
    '--accent': '252 211 77',
  },
  // Dusk — twilight indigo with rose gold
  dusk: {
    '--bg': '8 6 20',
    '--surface': '16 12 38',
    '--surface-hover': '26 20 58',
    '--surface-elevated': '36 28 78',
    '--border': '50 38 100',
    '--text': '240 234 255',
    '--text-muted': '160 140 210',
    '--text-dim': '72 58 110',
    '--primary': '192 132 252',
    '--primary-hover': '168 85 247',
    '--primary-bg': '30 20 65',
    '--accent': '251 113 133',
  },
};

export default function EditorShell() {
  const router = useRouter();

  const { user, requireAuth } = useAuth();

  const {
    viewMode,
    setViewMode,
    activePanel,
    setActivePanel,
    theme,
    isCopilotOpen,
    setIsCopilotOpen,
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
    setIsPublishPromptModalOpen,
  } = useUI();

  const {
    projects,
    activeProjectId,
    code,
    setCode,
    customStyle,
    setCustomStyle,
    lastSaved,
    saveStatus,
    pendingDeleteId,
    setPendingDeleteId,
    canUndo,
    canRedo,
    activeProject,
    undo,
    redo,
    handleCreateProject,
    handleCreateFromTemplate,
    handleAIUpdate,
    handleManualSnapshot,
    handleRestoreVersion,
    handleDuplicateDiagram,
    confirmDeleteProject,
  } = useEditor();

  const [error, setError] = useState<string | null>(null);
  const [selectionRequest, setSelectionRequest] = useState<{ text: string; ts: number } | null>(
    null
  );
  const [isFixing, setIsFixing] = useState(false);

  const { splitPercent, startDrag, snapToDefault, containerRef } = useSplitPane(
    35,
    'archigram-split-pct'
  );

  const { handleExportSvg, handleExportPng } = useExportHandlers({ code, theme, customStyle });

  const setCurrentView = (view: AppView) => router.push(VIEW_TO_PATH[view]);

  const handleShare = () => {
    const hash = encodeCodeToUrl(code);
    let shareUrl = window.location.href.split('#')[0];
    if (shareUrl.endsWith('/')) shareUrl = shareUrl.slice(0, -1);
    const fullUrl = `${shareUrl}#${hash}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => toast.success('Link copied to clipboard'))
      .catch((e) => {
        console.error('Clipboard failed', e);
        toast.error('Failed to copy link');
      });
  };

  const {
    auditReport,
    isAuditing,
    isPublishing,
    publishData,
    setPublishData,
    pendingPromptText,
    pendingPromptResultCode,
    openPublishModal,
    submitPublish,
    handleAudit,
    handleOpenPublishPrompt,
    consumeExternalPrompt,
  } = usePublishFlow({
    code,
    activeProjectId,
    projects,
    user,
    requireAuth,
    setIsPublishModalOpen,
    setIsAuditModalOpen,
    setIsPublishPromptModalOpen,
  });

  const handleFixError = async () => {
    if (!code || !error) return;
    setIsFixing(true);
    try {
      const res = await fetch('/api/v1/fix-syntax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, errorMessage: error }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fix failed');
      const { code: fixedCode } = await res.json();
      if (fixedCode) {
        setCode(fixedCode);
        handleAIUpdate(fixedCode);
        setError(null);
        toast.success('Syntax error auto-corrected');
      }
    } catch (e) {
      console.error('Auto-fix failed:', e);
      toast.error('Failed to fix code automatically.');
    } finally {
      setIsFixing(false);
    }
  };

  useKeyboardShortcuts({
    currentView: 'app',
    isPublishModalOpen,
    isImageImportModalOpen,
    isAuditModalOpen,
    isCommandPaletteOpen,
    isShortcutsModalOpen,
    setCurrentView,
    setIsCopilotOpen,
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
    setViewMode,
  });

  const appStyle = THEMES[theme] || THEMES.dark;

  return (
    <div
      className="min-h-dvh w-full flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20"
      style={appStyle}
    >
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-1.5 focus:bg-primary focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to editor
      </a>

      {/* CommandBar */}
      <Suspense fallback={<div className="h-11 border-b border-border bg-background shrink-0" />}>
        <CommandBar
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onShare={handleShare}
          onPublish={openPublishModal}
          onAudit={handleAudit}
          onNavigate={setCurrentView}
        />
      </Suspense>

      {/* Main area */}
      <main id="main" className="flex-1 flex overflow-hidden relative">
        {/* LeftPanel — desktop inline */}
        <div
          className={`hidden md:flex h-full transition-[width] duration-150 ease-out overflow-hidden shrink-0 ${activePanel !== null ? 'w-60' : 'w-0'}`}
        >
          <div className="w-60 h-full overflow-hidden">
            <Suspense fallback={<div className="w-60 h-full bg-surface" />}>
              <LeftPanel
                onCreateProject={handleCreateProject}
                onCreateFromTemplate={handleCreateFromTemplate}
                onScanImage={() => setIsImageImportModalOpen(true)}
                onOpenGallery={() => setCurrentView('gallery')}
              />
            </Suspense>
          </div>
        </div>

        {/* Mobile overlay */}
        {activePanel !== null && (
          <div className="md:hidden absolute inset-0 z-40 flex">
            <div className="w-60 h-full shadow-lg relative z-50 bg-surface">
              <Suspense fallback={null}>
                <LeftPanel
                  onCreateProject={() => {
                    handleCreateProject();
                    setActivePanel(null);
                  }}
                  onCreateFromTemplate={(n, c) => {
                    handleCreateFromTemplate(n, c);
                    setActivePanel(null);
                  }}
                  onScanImage={() => setIsImageImportModalOpen(true)}
                  onOpenGallery={() => {
                    setCurrentView('gallery');
                    setActivePanel(null);
                  }}
                />
              </Suspense>
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setActivePanel(null)} />
          </div>
        )}

        {/* Split pane */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden">
          {(viewMode === ViewMode.Split || viewMode === ViewMode.Code) && (
            <div
              style={viewMode === ViewMode.Split ? { width: `${splitPercent}%` } : undefined}
              className={`flex flex-col border-r border-border overflow-hidden ${viewMode === ViewMode.Code ? 'flex-1' : 'shrink-0'}`}
            >
              <Suspense fallback={<div className="w-full h-full bg-background animate-pulse" />}>
                <CodeEditor
                  code={code}
                  onChange={setCode}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  error={error}
                  selectionRequest={selectionRequest}
                  theme={theme}
                  onFixError={handleFixError}
                  isFixing={isFixing}
                />
              </Suspense>
            </div>
          )}

          {viewMode === ViewMode.Split && (
            <div
              onMouseDown={startDrag}
              onDoubleClick={snapToDefault}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize editor panels"
              className="w-1 shrink-0 bg-border hover:bg-primary/60 cursor-col-resize transition-colors duration-150 relative group z-10"
              title="Drag to resize · Double-click to reset"
            >
              <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
            </div>
          )}

          {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
            <div className="flex-1 flex flex-col bg-surface/50 relative overflow-hidden">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
                  </div>
                }
              >
                <DiagramPreview
                  code={code}
                  onError={setError}
                  theme={theme}
                  customStyle={customStyle}
                  onUpdateStyle={setCustomStyle}
                  onElementClick={(text) => {
                    setSelectionRequest({ text, ts: Date.now() });
                    if (viewMode === ViewMode.Preview) setViewMode(ViewMode.Split);
                  }}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Copilot panel — right dock */}
        {isCopilotOpen && (
          <Suspense fallback={null}>
            <CopilotPanel
              projectId={activeProjectId}
              currentCode={code}
              onCodeUpdate={handleAIUpdate}
              versions={activeProject?.versions || []}
              onRestoreVersion={handleRestoreVersion}
              onSaveVersion={handleManualSnapshot}
              onSharePrompt={handleOpenPublishPrompt}
              externalPrompt={pendingPromptText || undefined}
              externalResultCode={pendingPromptResultCode}
              onConsumeExternalPrompt={consumeExternalPrompt}
            />
          </Suspense>
        )}
      </main>

      {/* Status bar */}
      <div
        className="h-[22px] border-t border-border bg-surface flex items-center shrink-0 select-none overflow-hidden"
        role="status"
        aria-label="Editor status"
      >
        <div className="w-1 self-stretch bg-primary shrink-0" />
        <div className="flex items-center gap-2 px-3 text-[11px] font-mono text-text-muted">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400 shrink-0" />
              <span className="text-amber-400 tracking-wide">SAVING</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="tracking-wide">SAVED</span>
            </>
          )}
          {lastSaved && (
            <span className="text-text-dim hidden sm:inline">
              {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex-1" />
        <div className="flex items-center h-full text-[11px] font-mono text-text-dim">
          <span
            className="hidden md:flex items-center h-full px-3 border-l border-border hover:bg-surface-hover hover:text-text-muted cursor-default transition-colors"
            title="Open command palette"
          >
            ⌘K
          </span>
          <span
            className="hidden lg:flex items-center h-full px-3 border-l border-border hover:bg-surface-hover hover:text-text-muted cursor-default transition-colors"
            title="Keyboard shortcuts"
          >
            ?
          </span>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setPendingDeleteId(null);
          }}
        >
          <div className="bg-surface border border-border rounded-xl shadow-md p-6 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-lg font-bold text-text">
                  Delete Project?
                </h3>
                <p className="text-sm text-text-muted mt-2">
                  Are you sure you want to delete this project? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={() => setPendingDeleteId(null)}
                  autoFocus
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-text active:scale-95 transition-all text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All modals via registry */}
      <Suspense fallback={null}>
        <ModalRenderer
          auditReport={auditReport}
          isAuditing={isAuditing}
          isPublishing={isPublishing}
          publishData={publishData}
          setPublishData={setPublishData}
          submitPublish={submitPublish}
          pendingPromptText={pendingPromptText}
          pendingPromptResultCode={pendingPromptResultCode}
          consumeExternalPrompt={consumeExternalPrompt}
          onScanImage={() => setIsImageImportModalOpen(true)}
          onNavigate={setCurrentView}
          onNewProject={handleCreateProject}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          onShare={handleShare}
          onPublish={openPublishModal}
          onDuplicate={handleDuplicateDiagram}
          onAudit={handleAudit}
        />
      </Suspense>
    </div>
  );
}
