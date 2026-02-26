import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { ViewMode, DiagramTheme, User } from './types.ts';
import { encodeCodeToUrl } from './utils/url.ts';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.ts';
import { useAppRouter } from './hooks/useAppRouter.ts';
import { useProjects } from './hooks/useProjects.ts';
import { useDiagramSync } from './hooks/useDiagramSync.ts';
import { PanelLeftOpen, Trash2, Loader2 } from 'lucide-react';
import {
  publishDiagram,
  getCurrentUser,
  onAuthStateChange,
  signOut,
} from './services/supabaseClient.ts';
import { auditDiagram, AuditReport } from './services/geminiService.ts';
import { analytics } from './utils/analytics.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Toaster, toast } from 'sonner';
import { AUTHOR_KEY } from './constants.ts';

// Dynamic Component Imports
const Header = lazy(() => import('./components/Header.tsx'));
const CodeEditor = lazy(() => import('./components/CodeEditor.tsx'));
const DiagramPreview = lazy(() => import('./components/DiagramPreview.tsx'));
const AIChat = lazy(() => import('./components/AIChat.tsx'));
const LandingPage = lazy(() => import('./components/LandingPage.tsx'));
const Sidebar = lazy(() => import('./components/Sidebar.tsx'));
const Documentation = lazy(() => import('./components/Documentation.tsx'));
const CommunityGallery = lazy(() => import('./components/CommunityGallery.tsx'));
const FAQPage = lazy(() => import('./components/FAQPage.tsx'));
const DiscoverPage = lazy(() => import('./components/DiscoverPage.tsx'));
const LegalPage = lazy(() => import('./components/LegalPage.tsx'));
// New Studios
const PlantUMLStudio = lazy(() => import('./components/PlantUMLStudio.tsx'));
// Modals
const ImageImportModal = lazy(() => import('./components/ImageImportModal.tsx'));
const AuditModal = lazy(() => import('./components/AuditModal.tsx'));
const CommandPalette = lazy(() => import('./components/CommandPalette.tsx'));
const AuthModal = lazy(() => import('./components/AuthModal.tsx'));
const ProfilePage = lazy(() => import('./components/ProfilePage.tsx'));
const PublishModal = lazy(() => import('./components/PublishModal.tsx'));
const PromptMarketplace = lazy(() => import('./components/PromptMarketplace.tsx'));
const PublishPromptModal = lazy(() => import('./components/PublishPromptModal.tsx'));
const EmbedView = lazy(() => import('./components/EmbedView.tsx'));

// Loading Fallback
const LoadingScreen = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-zinc-500 font-mono animate-pulse">Loading ArchiGram...</p>
    </div>
  </div>
);

// Theme Configuration for CSS Variables (RGB Tuples)
type ThemeVars = React.CSSProperties & Record<`--${string}`, string>;

const THEMES: Record<DiagramTheme, ThemeVars> = {
  dark: {
    // Obsidian / Zinc (Professional Default)
    '--bg': '9 9 11', // zinc-950
    '--surface': '24 24 27', // zinc-900
    '--surface-hover': '39 39 42', // zinc-800
    '--border': '63 63 70', // zinc-700
    '--text': '228 228 231', // zinc-200
    '--text-muted': '161 161 170', // zinc-400
    '--primary': '99 102 241', // indigo-500
    '--primary-hover': '79 70 229', // indigo-600
    '--accent': '168 85 247', // purple-500
  },
  midnight: {
    // Deep Space / Slate (Sci-Fi)
    '--bg': '2 6 23', // slate-950
    '--surface': '15 23 42', // slate-900
    '--surface-hover': '30 41 59', // slate-800
    '--border': '51 65 85', // slate-700
    '--text': '241 245 249', // slate-100
    '--text-muted': '148 163 184', // slate-400
    '--primary': '56 189 248', // sky-400
    '--primary-hover': '14 165 233', // sky-500
    '--accent': '236 72 153', // pink-500
  },
  forest: {
    // Matrix / Terminal (Hacker)
    '--bg': '2 10 5', // Deep green/black
    '--surface': '5 25 15', // Dark jungle
    '--surface-hover': '10 40 25',
    '--border': '20 60 40',
    '--text': '236 253 245', // emerald-50
    '--text-muted': '52 211 153', // emerald-400 (bright for muted in terminal)
    '--primary': '74 222 128', // green-400
    '--primary-hover': '34 197 94', // green-500
    '--accent': '250 204 21', // yellow-400
  },
  neutral: {
    // Paper / Print (Clean Light Mode)
    '--bg': '255 255 255', // white
    '--surface': '241 245 249', // slate-100
    '--surface-hover': '226 232 240', // slate-200
    '--border': '203 213 225', // slate-300
    '--text': '15 23 42', // slate-900
    '--text-muted': '100 116 139', // slate-500
    '--primary': '37 99 235', // blue-600
    '--primary-hover': '29 78 216', // blue-700
    '--accent': '236 72 153', // pink-500
  },
};

function App() {
  // --- Router ---
  const { currentView, setCurrentView } = useAppRouter();

  // --- UI State ---
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<DiagramTheme>('dark');
  const [error, setError] = useState<string | null>(null);
  const [selectionRequest, setSelectionRequest] = useState<{ text: string; ts: number } | null>(
    null
  );
  const [isFixing, setIsFixing] = useState(false);
  const [isAIChatExpanded, setIsAIChatExpanded] = useState(true);

  // --- Modal States ---
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [publishData, setPublishData] = useState({
    title: '',
    author: '',
    description: '',
    tags: '',
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPublishPromptModalOpen, setIsPublishPromptModalOpen] = useState(false);
  const [pendingPromptText, setPendingPromptText] = useState('');
  const [pendingPromptResultCode, setPendingPromptResultCode] = useState<string | undefined>();

  // --- Authentication ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const pendingAction = useRef<(() => void) | null>(null);

  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      pendingAction.current = action;
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
    }
  };

  useEffect(() => {
    getCurrentUser().then(setUser);

    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- Projects (extracted hook) ---
  const {
    projects,
    setProjects,
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
    handleFork,
    handleSelectProject,
    handleRenameProject,
    handleDeleteProject,
    confirmDeleteProject,
    handleImageImport,
    handleDuplicateDiagram,
    handleAIUpdate,
    handleManualSnapshot,
    handleRestoreVersion,
  } = useProjects({ setCurrentView, setIsSidebarOpen, setViewMode });

  useDiagramSync({ user, projects, setProjects });

  // --- Responsive Layout ---
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

  // --- Export/Share Handlers ---

  const handleShare = () => {
    const hash = encodeCodeToUrl(code);
    let shareUrl = window.location.href.split('#')[0];
    if (shareUrl.endsWith('/')) {
      shareUrl = shareUrl.slice(0, -1);
    }
    const fullUrl = `${shareUrl}#${hash}`;

    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        toast.success('Link copied to clipboard');
      })
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
      code: code,
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
      const report = await auditDiagram(code);
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
      const { fixDiagramSyntax } = await import('./services/geminiService.ts');
      const fixedCode = await fixDiagramSyntax(code, error);
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

  const handleTryPrompt = (promptText: string, _domain: string, resultCode?: string) => {
    // Navigate to app view and load the prompt text into AI chat
    setCurrentView('app');
    // Store the prompt to be picked up by AIChat
    setPendingPromptText(promptText);
    setPendingPromptResultCode(resultCode);
    setIsAIChatExpanded(true);
  };

  const handleOpenPublishPrompt = (promptText: string, resultCode?: string) => {
    setPendingPromptText(promptText);
    setPendingPromptResultCode(resultCode);
    setIsPublishPromptModalOpen(true);
  };

  // --- Keyboard Shortcuts ---

  useKeyboardShortcuts({
    currentView,
    isPublishModalOpen,
    isImageImportModalOpen,
    isAuditModalOpen,
    isCommandPaletteOpen,
    setCurrentView,
    setIsAIChatExpanded,
    setIsCommandPaletteOpen,
    setIsPublishModalOpen,
    setIsImageImportModalOpen,
    setIsAuditModalOpen,
    handleCreateProject,
    handleExportPng,
    handleExportSvg,
    handleDuplicateDiagram,
    openPublishModal,
  });

  // --- Embed mode short-circuit (after all hooks) ---
  const embedParams = new URLSearchParams(window.location.search);
  if (embedParams.get('embed') === 'true') {
    return (
      <Suspense fallback={null}>
        <EmbedView />
      </Suspense>
    );
  }

  // --- Theme ---
  const appStyle = THEMES[theme] || THEMES.dark;

  // --- Route-Based Views ---

  if (currentView === 'landing') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LandingPage onNavigate={setCurrentView} />
      </Suspense>
    );
  }

  if (currentView === 'docs') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Documentation onNavigate={setCurrentView} />
      </Suspense>
    );
  }

  if (currentView === 'gallery') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <CommunityGallery
          onNavigate={setCurrentView}
          onFork={handleFork}
          user={user}
          onOpenAuth={() => {
            setAuthModalMode('signin');
            setIsAuthModalOpen(true);
          }}
          onRequireAuth={requireAuth}
        />
      </Suspense>
    );
  }

  if (currentView === 'discover') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <DiscoverPage onNavigate={setCurrentView} onFork={handleFork} />
      </Suspense>
    );
  }

  if (currentView === 'prompts') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PromptMarketplace
          onNavigate={setCurrentView}
          onTryPrompt={handleTryPrompt}
          onRequireAuth={requireAuth}
        />
      </Suspense>
    );
  }

  if (currentView === 'faq') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <FAQPage onNavigate={setCurrentView} />
      </Suspense>
    );
  }

  if (currentView === 'privacy' || currentView === 'terms' || currentView === 'license') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LegalPage type={currentView} onNavigate={setCurrentView} />
      </Suspense>
    );
  }

  if (currentView === 'profile') {
    if (!user) {
      setCurrentView('landing');
      return null;
    }
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ProfilePage
          user={user}
          projects={projects}
          onSignOut={async () => {
            await signOut();
            setUser(null);
            setCurrentView('landing');
          }}
          onOpenDiagram={(project) => {
            handleSelectProject(project.id);
            setCurrentView('app');
          }}
          onDeleteProject={handleDeleteProject}
        />
      </Suspense>
    );
  }

  if (currentView === 'plantuml') {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PlantUMLStudio onNavigate={setCurrentView} />
      </Suspense>
    );
  }

  return (
    <div
      className="h-screen w-screen flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500 selection:bg-primary/20"
      style={appStyle}
    >
      <Suspense fallback={<div className="h-16 border-b border-border bg-background/80"></div>}>
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
          onOpenAuth={(mode) => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
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
              fallback={<div className="w-full h-full bg-surface/80 border-r border-border"></div>}
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

        {/* Mobile Sidebar Overlay (Only visible on small screens) */}
        {isSidebarOpen && (
          <div className="md:hidden absolute inset-0 z-40 flex">
            <div className="w-72 h-full shadow-2xl relative z-50">
              <Suspense fallback={<div className="w-full h-full bg-surface"></div>}>
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
                  toggleCollapse={() => {}} // No collapse on mobile
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
            ></div>
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
            <Suspense fallback={<div className="w-full h-full bg-background animate-pulse"></div>}>
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

      {/* Confirmation Modal for Deletion */}
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

      {/* Image Import Modal */}
      {isImageImportModalOpen && (
        <Suspense fallback={null}>
          <ImageImportModal
            onClose={() => setIsImageImportModalOpen(false)}
            onImport={handleImageImport}
          />
        </Suspense>
      )}

      {/* Audit Modal */}
      {isAuditModalOpen && (
        <Suspense fallback={null}>
          <AuditModal
            onClose={() => setIsAuditModalOpen(false)}
            isLoading={isAuditing}
            report={auditReport}
          />
        </Suspense>
      )}

      {/* Publish Modal */}
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

      {/* Command Palette */}
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

      {/* Publish Prompt Modal */}
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

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={(user) => {
              setUser(user);
              setIsAuthModalOpen(false);
              if (pendingAction.current) {
                pendingAction.current();
                pendingAction.current = null;
              }
            }}
            initialMode={authModalMode}
          />
        </Suspense>
      )}

      <Toaster
        theme={theme === 'neutral' ? 'light' : 'dark'}
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgb(var(--surface))',
            border: '1px solid rgba(var(--primary), 0.3)',
            color: 'rgb(var(--text))',
          },
        }}
      />
    </div>
  );
}

// Wrap App with ErrorBoundary for graceful error handling
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
