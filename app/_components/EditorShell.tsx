'use client';

import React, { useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { PanelLeftOpen, Trash2, Loader2 } from 'lucide-react';
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
  dark: {
    '--bg': '13 13 15',
    '--surface': '20 20 22',
    '--surface-hover': '28 28 31',
    '--surface-elevated': '36 36 40',
    '--border': '42 42 46',
    '--text': '228 228 231',
    '--text-muted': '113 113 122',
    '--text-dim': '63 63 70',
    '--primary': '99 102 241',
    '--primary-hover': '79 70 229',
    '--primary-bg': '30 30 63',
    '--accent': '168 85 247',
  },
  midnight: {
    '--bg': '2 6 23',
    '--surface': '15 23 42',
    '--surface-hover': '30 41 59',
    '--border': '51 65 85',
    '--text': '241 245 249',
    '--text-muted': '148 163 184',
    '--primary': '56 189 248',
    '--primary-hover': '14 165 233',
    '--accent': '236 72 153',
  },
  forest: {
    '--bg': '2 10 5',
    '--surface': '5 25 15',
    '--surface-hover': '10 40 25',
    '--border': '20 60 40',
    '--text': '236 253 245',
    '--text-muted': '52 211 153',
    '--primary': '74 222 128',
    '--primary-hover': '34 197 94',
    '--accent': '250 204 21',
  },
  neutral: {
    '--bg': '255 255 255',
    '--surface': '241 245 249',
    '--surface-hover': '226 232 240',
    '--border': '203 213 225',
    '--text': '15 23 42',
    '--text-muted': '100 116 139',
    '--primary': '37 99 235',
    '--primary-hover': '29 78 216',
    '--accent': '236 72 153',
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

  // Navigation helper
  const setCurrentView = (view: AppView) => router.push(VIEW_TO_PATH[view]);

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
  });

  const appStyle = THEMES[theme] || THEMES.dark;

  return (
    <div
      className="h-screen w-screen flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20"
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
          customStyle={customStyle}
          onUpdateStyle={setCustomStyle}
          onPublish={openPublishModal}
          onNavigate={setCurrentView}
          onSaveVersion={handleManualSnapshot}
          onAudit={handleAudit}
          user={user}
          onOpenAuth={(mode) => openAuth(mode)}
        />
      </Suspense>

      <main className="flex-1 flex overflow-hidden relative">
        {isSidebarOpen && (
          <div
            className={`
              hidden md:block h-full relative z-10 transition-[width] duration-300 ease-in-out
              ${isSidebarCollapsed ? 'w-[70px]' : 'w-72'}
            `}
          >
            <Suspense
              fallback={<div className="w-full h-full bg-surface/80 border-r border-border" />}
            >
              <Sidebar
                projects={projects}
                activeProjectId={activeProjectId}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
                onCreateFromTemplate={handleCreateFromTemplate}
                onDeleteProject={handleDeleteProject}
                onClose={() => setIsSidebarOpen(false)}
                lastSaved={lastSaved}
                saveStatus={saveStatus}
                onRenameProject={handleRenameProject}
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onOpenGallery={() => setCurrentView('gallery')}
                onScanImage={() => setIsImageImportModalOpen(true)}
              />
            </Suspense>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden absolute inset-0 z-40 flex">
            <div className="w-72 h-full shadow-2xl relative z-50">
              <Suspense fallback={<div className="w-full h-full bg-surface" />}>
                <Sidebar
                  projects={projects}
                  activeProjectId={activeProjectId}
                  onSelectProject={(id) => {
                    handleSelectProject(id);
                    setIsSidebarOpen(false);
                  }}
                  onCreateProject={() => {
                    handleCreateProject();
                    setIsSidebarOpen(false);
                  }}
                  onCreateFromTemplate={(name, code) => {
                    handleCreateFromTemplate(name, code);
                    setIsSidebarOpen(false);
                  }}
                  onDeleteProject={handleDeleteProject}
                  onClose={() => setIsSidebarOpen(false)}
                  lastSaved={lastSaved}
                  saveStatus={saveStatus}
                  onRenameProject={handleRenameProject}
                  isCollapsed={false}
                  toggleCollapse={() => {}}
                  onOpenGallery={() => {
                    setCurrentView('gallery');
                    setIsSidebarOpen(false);
                  }}
                  onScanImage={() => setIsImageImportModalOpen(true)}
                />
              </Suspense>
            </div>
            <div
              className="flex-1 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 p-2 bg-surface hover:bg-surface-hover rounded-md text-text-muted hover:text-text border border-border shadow-lg transition-all"
            title="Open Projects"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {(viewMode === ViewMode.Split || viewMode === ViewMode.Code) && (
          <div
            className={`
              flex flex-col transition-all duration-300 ease-in-out border-r border-border
              ${viewMode === ViewMode.Split ? 'w-1/3' : 'w-full'}
            `}
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

        {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
          <div
            className={`${viewMode === ViewMode.Split ? 'w-2/3' : 'w-full'} bg-surface/50 relative`}
          >
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
      </main>

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
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-text-muted hover:bg-surface-hover hover:text-text transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProject}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium shadow-lg shadow-red-500/20"
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
