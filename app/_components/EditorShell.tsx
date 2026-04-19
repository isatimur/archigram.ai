'use client';
// Next.js editor shell — replaces App.tsx (the legacy Vite entry).
// App.tsx's sidebar state and layout are intentionally NOT updated here;
// App.tsx will be removed in Phase 2 of the migration.

import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import ActivityBar from '@/app/_components/ActivityBar';
import type { ActivePanel } from '@/lib/contexts/UIContext';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useUI } from '@/lib/contexts/UIContext';
import { useEditor } from '@/lib/contexts/EditorContext';
import { VIEW_TO_PATH } from '@/app/_components/NavigationAdapter';
import { ViewMode } from '@/types';
import type { DiagramTheme, AppView } from '@/types';
import { publishDiagram } from '@/lib/supabase/browser';
import type { AuditReport } from '@/services/geminiService';
import { encodeCodeToUrl } from '@/utils/url';
import { analytics } from '@/utils/analytics';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AUTHOR_KEY } from '@/constants';

// Dynamic Component Imports
const Header = lazy(() => import('@/components/Header'));
const CodeEditor = lazy(() => import('@/components/CodeEditor'));
const DiagramPreview = lazy(() => import('@/components/DiagramPreview'));
const AIChat = lazy(() => import('@/components/AIChat'));
const Sidebar = lazy(() => import('@/components/Sidebar'));
const ImageImportModal = lazy(() => import('@/components/ImageImportModal'));
const AuditModal = lazy(() => import('@/components/AuditModal'));
const CommandPalette = lazy(() => import('@/components/CommandPalette'));
const AuthModal = lazy(() => import('@/components/AuthModal'));
const PublishModal = lazy(() => import('@/components/PublishModal'));
const PublishPromptModal = lazy(() => import('@/components/PublishPromptModal'));
const KeyboardShortcutsModal = lazy(() => import('@/components/KeyboardShortcutsModal'));

// Theme CSS variable configuration (RGB tuples)
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

  // Contexts
  const {
    user,
    isAuthModalOpen,
    authModalMode,
    setIsAuthModalOpen,
    openAuth,
    onAuthSuccess,
    requireAuth,
  } = useAuth();

  const {
    viewMode,
    setViewMode,
    activePanel,
    setActivePanel,
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
    handleSelectProject,
    handleRenameProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleImageImport,
    handleDuplicateDiagram,
    handleAIUpdate,
    handleManualSnapshot,
    handleRestoreVersion,
  } = useEditor();

  // Editor-local state
  const [error, setError] = useState<string | null>(null);
  const [selectionRequest, setSelectionRequest] = useState<{ text: string; ts: number } | null>(
    null
  );
  const [isFixing, setIsFixing] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [publishData, setPublishData] = useState({
    title: '',
    author: '',
    description: '',
    tags: '',
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [pendingPromptText, setPendingPromptText] = useState('');
  const [pendingPromptResultCode, setPendingPromptResultCode] = useState<string | undefined>();

  // Resizable split pane
  const [splitPercent, setSplitPercent] = useState(35);
  const splitDragging = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!splitDragging.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(pct, 15), 80));
    };
    const onUp = () => {
      if (!splitDragging.current) return;
      splitDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startSplitDrag = () => {
    splitDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Navigation helper
  const setCurrentView = (view: AppView) => router.push(VIEW_TO_PATH[view]);

  const handlePanelToggle = (panel: Exclude<ActivePanel, null>) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  // --- Export/Share Handlers ---

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

  const getSvgData = () => {
    const container = document.getElementById('diagram-output-container');
    const svg = container?.querySelector('svg');
    if (!svg) return null;

    const clone = svg.cloneNode(true) as SVGElement;

    let width = 0,
      height = 0;
    const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number);

    if (viewBox && viewBox.length === 4) {
      width = viewBox[2];
      height = viewBox[3];
    } else {
      const rect = svg.getBoundingClientRect();
      const transform = container?.style.transform;
      const scaleMatch = transform?.match(/scale\(([\d.]+)\)/);
      const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      width = rect.width / currentScale;
      height = rect.height / currentScale;
    }

    clone.setAttribute('width', width.toString());
    clone.setAttribute('height', height.toString());
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const bgColor = customStyle.backgroundColor || (theme === 'neutral' ? '#ffffff' : '#131316');
    clone.style.backgroundColor = bgColor;

    return { clone, width, height, bgColor };
  };

  const handleExportSvg = () => {
    const data = getSvgData();
    if (!data) {
      toast.error('Export failed: No diagram found');
      return;
    }
    const { clone } = data;
    try {
      analytics.exportSvg();
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(clone);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `archigram-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('SVG Export failed:', e);
      toast.error('SVG Export failed');
    }
  };

  const handleExportPng = () => {
    const data = getSvgData();
    if (!data) return;
    const { clone, width, height, bgColor } = data;
    try {
      analytics.exportPng();
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 3;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const link = document.createElement('a');
          link.download = `archigram-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = (e) => {
        console.error('Image load error for PNG export', e);
        toast.error('PNG Generation failed');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e) {
      console.error('PNG Export failed:', e);
      toast.error('PNG Export failed');
    }
  };

  // --- Publish Handlers ---

  const openPublishModal = () => {
    requireAuth(() => {
      const activeP = projects.find((p) => p.id === activeProjectId);
      setPublishData({
        title: activeP?.name || '',
        author: localStorage.getItem(AUTHOR_KEY) || '',
        description: '',
        tags: '',
      });
      setIsPublishModalOpen(true);
    });
  };

  const submitPublish = async () => {
    if (!publishData.title.trim() || !code.trim()) return;
    setIsPublishing(true);
    if (publishData.author) localStorage.setItem(AUTHOR_KEY, publishData.author);

    const tagsArray = publishData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const success = await publishDiagram({
      title: publishData.title,
      author: user?.username || publishData.author || 'Anonymous',
      description: publishData.description,
      code,
      tags: tagsArray,
    });

    setIsPublishing(false);
    if (success) {
      analytics.diagramPublished(tagsArray);
      setIsPublishModalOpen(false);
      toast.success('Diagram successfully published to Gallery!');
    } else {
      toast.error('Failed to publish. Try again.');
    }
  };

  // --- Audit Handler ---

  const handleAudit = async () => {
    analytics.auditRun();
    setIsAuditModalOpen(true);
    setIsAuditing(true);
    setAuditReport(null);
    try {
      const res = await fetch('/api/v1/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Audit failed');
      const report: AuditReport = await res.json();
      setAuditReport(report);
    } catch (e) {
      console.error(e);
      toast.error('Audit failed. Please try again.');
      setIsAuditModalOpen(false);
    } finally {
      setIsAuditing(false);
    }
  };

  // --- Syntax Fix Handler ---

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

  // --- Prompt Handlers ---

  const handleOpenPublishPrompt = (promptText: string, resultCode?: string) => {
    setPendingPromptText(promptText);
    setPendingPromptResultCode(resultCode);
    setIsPublishPromptModalOpen(true);
  };

  // --- Keyboard Shortcuts ---

  useKeyboardShortcuts({
    currentView: 'app',
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
    setViewMode,
  });

  const appStyle = THEMES[theme] || THEMES.dark;

  return (
    <div
      className="min-h-dvh w-full flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20"
      style={appStyle}
    >
      <Suspense fallback={<div className="h-16 border-b border-border bg-background/80" />}>
        <Header
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExportPng={handleExportPng}
          onExportSvg={handleExportSvg}
          currentTheme={theme}
          setTheme={setTheme}
          onShare={handleShare}
          onNewProject={handleCreateProject}
          activeProject={activeProject}
          onRenameProject={handleRenameProject}
          onPublish={openPublishModal}
          onNavigate={setCurrentView}
          onSaveVersion={handleManualSnapshot}
          onAudit={handleAudit}
          user={user}
          onOpenAuth={(mode) => openAuth(mode)}
        />
      </Suspense>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Activity Bar — always visible */}
        <ActivityBar
          activePanel={activePanel}
          onPanelToggle={handlePanelToggle}
          onOpenCopilot={() => setIsAIChatExpanded(true)}
        />

        {/* Side Panel — slides open when activePanel is set */}
        <div
          className={`
            hidden md:flex h-full transition-[width] duration-150 ease-out overflow-hidden shrink-0
            border-r border-border bg-surface
            ${activePanel !== null ? 'w-60' : 'w-0'}
          `}
        >
          <div className="w-60 h-full overflow-hidden">
            <Suspense fallback={<div className="w-full h-full bg-surface" />}>
              <Sidebar
                projects={projects}
                activeProjectId={activeProjectId}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
                onCreateFromTemplate={handleCreateFromTemplate}
                onDeleteProject={handleDeleteProject}
                onClose={() => setActivePanel(null)}
                lastSaved={lastSaved}
                saveStatus={saveStatus}
                onRenameProject={handleRenameProject}
                isCollapsed={false}
                toggleCollapse={() => setActivePanel(null)}
                onOpenGallery={() => setCurrentView('gallery')}
                onScanImage={() => setIsImageImportModalOpen(true)}
              />
            </Suspense>
          </div>
        </div>

        {/* Mobile Side Panel Overlay */}
        {activePanel !== null && (
          <div className="md:hidden absolute inset-0 z-40 flex">
            <div className="w-60 h-full shadow-2xl relative z-50 bg-surface">
              <Suspense fallback={<div className="w-full h-full bg-surface" />}>
                <Sidebar
                  projects={projects}
                  activeProjectId={activeProjectId}
                  onSelectProject={(id) => {
                    handleSelectProject(id);
                    setActivePanel(null);
                  }}
                  onCreateProject={() => {
                    handleCreateProject();
                    setActivePanel(null);
                  }}
                  onCreateFromTemplate={(name, code) => {
                    handleCreateFromTemplate(name, code);
                    setActivePanel(null);
                  }}
                  onDeleteProject={handleDeleteProject}
                  onClose={() => setActivePanel(null)}
                  lastSaved={lastSaved}
                  saveStatus={saveStatus}
                  onRenameProject={handleRenameProject}
                  isCollapsed={false}
                  toggleCollapse={() => setActivePanel(null)}
                  onOpenGallery={() => {
                    setCurrentView('gallery');
                    setActivePanel(null);
                  }}
                  onScanImage={() => setIsImageImportModalOpen(true)}
                />
              </Suspense>
            </div>
            <div
              className="flex-1 bg-black/50 backdrop-blur-sm"
              onClick={() => setActivePanel(null)}
            />
          </div>
        )}

        {/* Resizable editor panes */}
        <div id="main" ref={splitContainerRef} className="flex-1 flex overflow-hidden">
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

          {/* Drag handle */}
          {viewMode === ViewMode.Split && (
            <div
              onMouseDown={startSplitDrag}
              onDoubleClick={() => setSplitPercent(35)}
              role="separator"
              aria-label="Resize editor panels"
              className="w-1 shrink-0 bg-border hover:bg-primary/60 cursor-col-resize transition-colors duration-150 relative group z-10"
              title="Drag to resize · Double-click to reset"
            >
              {/* Wider invisible hit area */}
              <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
            </div>
          )}

          {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
            <div className="flex-1 flex flex-col bg-surface/50 relative overflow-hidden">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <Loader2 className="w-8 h-8 animate-spin" />
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

              <Suspense fallback={null}>
                <AIChat
                  projectId={activeProjectId}
                  currentCode={code}
                  onCodeUpdate={handleAIUpdate}
                  theme={theme}
                  versions={activeProject?.versions || []}
                  onRestoreVersion={handleRestoreVersion}
                  onSaveVersion={handleManualSnapshot}
                  isExpanded={isAIChatExpanded}
                  onToggleExpanded={setIsAIChatExpanded}
                  onSharePrompt={handleOpenPublishPrompt}
                  externalPrompt={pendingPromptText || undefined}
                  externalResultCode={pendingPromptResultCode}
                  onConsumeExternalPrompt={() => {
                    setPendingPromptText('');
                    setPendingPromptResultCode(undefined);
                  }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </main>

      {/* Status bar */}
      <div
        className="h-[22px] border-t border-border bg-surface flex items-center shrink-0 select-none overflow-hidden"
        role="status"
        aria-label="Editor status"
      >
        {/* Left accent strip — primary color */}
        <div className="w-1 self-stretch bg-primary shrink-0" />
        {/* Save status */}
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
        {/* Keyboard hint chips */}
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

      {/* Delete Confirmation */}
      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setPendingDeleteId(null);
          }}
        >
          <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100 animate-slide-up">
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
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-text active:scale-95 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all text-sm font-medium shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isImageImportModalOpen && (
        <Suspense fallback={null}>
          <ImageImportModal
            onClose={() => setIsImageImportModalOpen(false)}
            onImport={handleImageImport}
          />
        </Suspense>
      )}

      {isAuditModalOpen && (
        <Suspense fallback={null}>
          <AuditModal
            onClose={() => setIsAuditModalOpen(false)}
            isLoading={isAuditing}
            report={auditReport}
          />
        </Suspense>
      )}

      {isPublishModalOpen && (
        <Suspense fallback={null}>
          <PublishModal
            isOpen={isPublishModalOpen}
            onClose={() => setIsPublishModalOpen(false)}
            publishData={publishData}
            onPublishDataChange={setPublishData}
            onSubmit={submitPublish}
            isPublishing={isPublishing}
            code={code}
            user={user}
          />
        </Suspense>
      )}

      {isCommandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onNavigate={setCurrentView}
            onNewProject={handleCreateProject}
            onExportPng={handleExportPng}
            onExportSvg={handleExportSvg}
            onShare={handleShare}
            onPublish={openPublishModal}
            onDuplicate={handleDuplicateDiagram}
            onAudit={handleAudit}
            onScanImage={() => setIsImageImportModalOpen(true)}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </Suspense>
      )}

      {isShortcutsModalOpen && (
        <Suspense fallback={null}>
          <KeyboardShortcutsModal
            isOpen={isShortcutsModalOpen}
            onClose={() => setIsShortcutsModalOpen(false)}
          />
        </Suspense>
      )}

      {isPublishPromptModalOpen && (
        <Suspense fallback={null}>
          <PublishPromptModal
            isOpen={isPublishPromptModalOpen}
            onClose={() => setIsPublishPromptModalOpen(false)}
            promptText={pendingPromptText}
            resultCode={pendingPromptResultCode}
            username={user?.username || ''}
          />
        </Suspense>
      )}

      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={onAuthSuccess}
            initialMode={authModalMode}
          />
        </Suspense>
      )}
    </div>
  );
}
