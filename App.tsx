
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ViewMode, DiagramTheme, AppView, Project, DiagramStyleConfig, CommunityDiagram, ProjectVersion } from './types.ts';
import { INITIAL_CODE, STORAGE_KEY, TEMPLATES } from './constants.ts';
import { encodeCodeToUrl, decodeCodeFromUrl } from './utils/url.ts';
import { CheckCircle2, PanelLeftOpen, Trash2, AlertTriangle, UploadCloud, X, Loader2 } from 'lucide-react';
import { publishDiagram } from './services/supabaseClient.ts';
import { auditDiagram, AuditReport } from './services/geminiService.ts';

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
const LegalPage = lazy(() => import('./components/LegalPage.tsx'));
// New Studios
const PlantUMLStudio = lazy(() => import('./components/PlantUMLStudio.tsx'));
const BPMNStudio = lazy(() => import('./components/BPMNStudio.tsx'));
// Modals
const ImageImportModal = lazy(() => import('./components/ImageImportModal.tsx'));
const AuditModal = lazy(() => import('./components/AuditModal.tsx'));

const PROJECTS_STORAGE_KEY = 'archigram_projects';

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
const THEMES: Record<DiagramTheme, React.CSSProperties> = {
  dark: {
    // Obsidian / Zinc (Professional Default)
    '--bg': '9 9 11',              // zinc-950
    '--surface': '24 24 27',       // zinc-900
    '--surface-hover': '39 39 42', // zinc-800
    '--border': '63 63 70',        // zinc-700
    '--text': '228 228 231',       // zinc-200
    '--text-muted': '161 161 170', // zinc-400
    '--primary': '99 102 241',     // indigo-500
    '--primary-hover': '79 70 229',// indigo-600
    '--accent': '168 85 247',      // purple-500
  } as any,
  midnight: {
    // Deep Space / Slate (Sci-Fi)
    '--bg': '2 6 23',              // slate-950
    '--surface': '15 23 42',       // slate-900
    '--surface-hover': '30 41 59', // slate-800
    '--border': '51 65 85',        // slate-700
    '--text': '241 245 249',       // slate-100
    '--text-muted': '148 163 184', // slate-400
    '--primary': '56 189 248',     // sky-400
    '--primary-hover': '14 165 233',// sky-500
    '--accent': '236 72 153',      // pink-500
  } as any,
  forest: {
    // Matrix / Terminal (Hacker)
    '--bg': '2 10 5',              // Deep green/black
    '--surface': '5 25 15',        // Dark jungle
    '--surface-hover': '10 40 25',
    '--border': '20 60 40',
    '--text': '236 253 245',       // emerald-50
    '--text-muted': '52 211 153',  // emerald-400 (bright for muted in terminal)
    '--primary': '74 222 128',     // green-400
    '--primary-hover': '34 197 94',// green-500
    '--accent': '250 204 21',      // yellow-400
  } as any,
  neutral: {
    // Paper / Print (Clean Light Mode)
    '--bg': '255 255 255',         // white
    '--surface': '241 245 249',    // slate-100
    '--surface-hover': '226 232 240', // slate-200
    '--border': '203 213 225',     // slate-300
    '--text': '15 23 42',          // slate-900
    '--text-muted': '100 116 139', // slate-500
    '--primary': '37 99 235',      // blue-600
    '--primary-hover': '29 78 216', // blue-700
    '--accent': '236 72 153',      // pink-500
  } as any,
};

function App() {
  // --- 1. App Level State ---
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  
  // Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // For desktop mini-mode

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // --- 2. Editor Level State ---
  const [code, setCode] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<DiagramTheme>('dark');
  const [showToast, setShowToast] = useState<{message: string, visible: boolean}>({ message: '', visible: false });
  const [selectionRequest, setSelectionRequest] = useState<{ text: string; ts: number } | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  // --- 3. Style State ---
  const [customStyle, setCustomStyle] = useState<DiagramStyleConfig>({});
  
  // --- 4. Modal States ---
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const [publishData, setPublishData] = useState({ title: '', author: '', description: '', tags: '' });
  const [isPublishing, setIsPublishing] = useState(false);

  // Ref for cleanup/persistence safety
  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // --- 5. Initialization Logic ---
  
  useEffect(() => {
    const hasHash = window.location.hash.length > 1;
    const hasProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    
    if (hasHash || hasProjects) {
        setCurrentView('app');
    }
    
    const loadProjects = () => {
        try {
            const rawProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
            let loadedProjects: Project[] = rawProjects ? JSON.parse(rawProjects) : [];

            // Migration
            const legacyCode = localStorage.getItem(STORAGE_KEY);
            if (legacyCode && loadedProjects.length === 0) {
                const legacyProject: Project = {
                    id: 'legacy-' + Date.now(),
                    name: 'My First Diagram',
                    code: legacyCode,
                    updatedAt: Date.now(),
                    versions: []
                };
                loadedProjects.push(legacyProject);
                localStorage.removeItem(STORAGE_KEY);
            }

            if (loadedProjects.length === 0) {
                loadedProjects.push({
                    id: 'init-' + Date.now(),
                    name: 'Uber System Flow',
                    code: INITIAL_CODE,
                    updatedAt: Date.now(),
                    versions: []
                });
            }

            setProjects(loadedProjects);
            
            if (loadedProjects.length > 0) {
                const mostRecent = loadedProjects.sort((a,b) => b.updatedAt - a.updatedAt)[0];
                setActiveProjectId(mostRecent.id);
                setCode(mostRecent.code);
                setHistory([mostRecent.code]);
                // Load saved style if exists
                if (mostRecent.styleConfig) {
                    setCustomStyle(mostRecent.styleConfig);
                }
            }
        } catch (e) {
            console.error("Failed to load projects", e);
            setProjects([{ id: 'err', name: 'New Diagram', code: INITIAL_CODE, updatedAt: Date.now(), versions: [] }]);
            setActiveProjectId('err');
            setCode(INITIAL_CODE);
        }
    };

    loadProjects();

    const hash = window.location.hash.slice(1);
    if (hash) {
        const decoded = decodeCodeFromUrl(hash);
        if (decoded) {
            const sharedProject: Project = {
                id: 'shared-' + Date.now(),
                name: 'Shared Diagram',
                code: decoded,
                updatedAt: Date.now(),
                versions: []
            };
            setProjects(prev => [sharedProject, ...prev]);
            setActiveProjectId(sharedProject.id);
            setCode(decoded);
            setHistory([decoded]);
            window.location.hash = '';
        }
    }

  }, []);

  // --- 6. Persistence & Project Management ---

  const isFirstRender = useRef(true);

  // Debounced auto-save
  useEffect(() => {
     if (projects.length === 0) return;

     if (isFirstRender.current) {
         isFirstRender.current = false;
         return;
     }

     setSaveStatus('saving');

     const saveTimeout = setTimeout(() => {
         localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
         setLastSaved(new Date());
         setSaveStatus('saved');
     }, 1000); // 1s debounce

     return () => clearTimeout(saveTimeout);
  }, [projects]);

  // Safety: Save on tab close
  useEffect(() => {
      const handleBeforeUnload = () => {
          if (projectsRef.current.length > 0) {
              localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectsRef.current));
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Persist Style Changes to Project
  useEffect(() => {
    if (!activeProjectId) return;

    setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId) {
            // Only update if code or style changed
            if(p.code !== code || JSON.stringify(p.styleConfig) !== JSON.stringify(customStyle)) {
                 return { ...p, code, styleConfig: customStyle, updatedAt: Date.now() };
            }
        }
        return p;
    }));
  }, [code, customStyle, activeProjectId]);

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

  // --- 7. Undo/Redo Logic ---
  useEffect(() => {
      if (history.length > 0 && code === history[historyIndex]) return;

      const timeout = setTimeout(() => {
          setHistory(prev => {
              const upToCurrent = prev.slice(0, historyIndex + 1);
              return [...upToCurrent, code];
          });
          setHistoryIndex(prev => prev + 1);
      }, 800);

      return () => clearTimeout(timeout);
  }, [code, historyIndex, history]);

  const undo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCode(history[newIndex]);
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCode(history[newIndex]);
      }
  };

  const addVersionToProject = (projectId: string, newCode: string, label: string, source: 'ai' | 'manual') => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              const newVersion: ProjectVersion = {
                  id: Date.now().toString(),
                  timestamp: Date.now(),
                  code: newCode,
                  label,
                  source
              };
              // Keep only last 50 versions to prevent localStorage bloat
              const updatedVersions = [newVersion, ...(p.versions || [])].slice(0, 50);
              return { ...p, versions: updatedVersions };
          }
          return p;
      }));
  };

  const handleAIUpdate = (newCode: string) => {
      // 1. Undo/Redo History
      setHistory(prev => {
          const upToCurrent = prev.slice(0, historyIndex + 1);
          return [...upToCurrent, newCode];
      });
      setHistoryIndex(prev => prev + 1);
      setCode(newCode);

      // 2. Version History (Auto Snapshot)
      if (activeProjectId) {
          addVersionToProject(activeProjectId, newCode, 'AI Update', 'ai');
      }
  };

  const handleManualSnapshot = (label: string = 'Manual Save') => {
      if (activeProjectId) {
          addVersionToProject(activeProjectId, code, label, 'manual');
          setShowToast({ message: 'Version saved successfully', visible: true });
          setTimeout(() => setShowToast({ message: '', visible: false }), 2000);
      }
  };

  const handleRestoreVersion = (version: ProjectVersion) => {
      setCode(version.code);
      // Also add to undo stack so user can undo the restore
      setHistory(prev => {
          const upToCurrent = prev.slice(0, historyIndex + 1);
          return [...upToCurrent, version.code];
      });
      setHistoryIndex(prev => prev + 1);
      
      setShowToast({ message: `Restored version: ${version.label}`, visible: true });
      setTimeout(() => setShowToast({ message: '', visible: false }), 2000);
  };

  // --- 8. Project Actions ---

  const handleCreateProject = () => {
      const newProject: Project = {
          id: Date.now().toString(),
          name: `Diagram ${projects.length + 1}`,
          code: `graph TD\n    A[Start] --> B[Process]\n    B --> C[End]`,
          updatedAt: Date.now(),
          styleConfig: {},
          versions: []
      };
      
      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects)); // Immediate save on create
      
      setActiveProjectId(newProject.id);
      setCode(newProject.code);
      setCustomStyle({});
      setHistory([newProject.code]);
      setHistoryIndex(0);
      
      if (window.innerWidth >= 768) {
        setViewMode(ViewMode.Split);
      }
      if (window.innerWidth < 1024) {
          setIsSidebarOpen(false);
      }
  };

  const handleCreateFromTemplate = (templateName: string, templateCode: string) => {
      const newProject: Project = {
          id: Date.now().toString(),
          name: templateName,
          code: templateCode,
          updatedAt: Date.now(),
          styleConfig: {},
          versions: []
      };

      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));

      setActiveProjectId(newProject.id);
      setCode(newProject.code);
      setCustomStyle({});
      setHistory([newProject.code]);
      setHistoryIndex(0);

      if (window.innerWidth >= 768) {
        setViewMode(ViewMode.Split);
      }
      if (window.innerWidth < 1024) {
          setIsSidebarOpen(false);
      }
  };
  
  // FORK FUNCTIONALITY
  const handleFork = (diagram: CommunityDiagram) => {
      const newProject: Project = {
          id: `fork-${Date.now()}`,
          name: `Fork: ${diagram.title}`,
          code: diagram.code,
          updatedAt: Date.now(),
          styleConfig: {},
          versions: []
      };

      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));

      setActiveProjectId(newProject.id);
      setCode(newProject.code);
      setCustomStyle({});
      setHistory([newProject.code]);
      setHistoryIndex(0);

      setCurrentView('app');
      setShowToast({ message: 'Forked successfully to workspace', visible: true });
      setTimeout(() => setShowToast({ message: '', visible: false }), 3000);
  };

  const handleSelectProject = (id: string) => {
      const project = projects.find(p => p.id === id);
      if (project) {
          setActiveProjectId(id);
          setCode(project.code);
          setCustomStyle(project.styleConfig || {});
          setHistory([project.code]);
          setHistoryIndex(0);
          
          if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
          }
      }
  };

  const handleRenameProject = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setProjects(prev => prev.map(p => {
        if (p.id === id) {
            return { ...p, name: newName, updatedAt: Date.now() };
        }
        return p;
    }));
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (projects.length <= 1) return;
      
      setPendingDeleteId(id);
  };

  const confirmDeleteProject = () => {
      if (!pendingDeleteId) return;

      const id = pendingDeleteId;
      setProjects(prev => {
          const next = prev.filter(p => p.id !== id);
          
          if (id === activeProjectId && next.length > 0) {
              const nextProject = next[0];
              setActiveProjectId(nextProject.id);
              setCode(nextProject.code);
              setCustomStyle(nextProject.styleConfig || {});
              setHistory([nextProject.code]);
              setHistoryIndex(0);
          }
          
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(next));
          return next;
      });
      
      setPendingDeleteId(null);
  };

  // Image Import Handler
  const handleImageImport = (importedCode: string) => {
      const newProject: Project = {
          id: 'imported-' + Date.now(),
          name: 'Scanned Diagram',
          code: importedCode,
          updatedAt: Date.now(),
          styleConfig: {},
          versions: []
      };

      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));

      setActiveProjectId(newProject.id);
      setCode(newProject.code);
      setCustomStyle({});
      setHistory([newProject.code]);
      setHistoryIndex(0);

      if (window.innerWidth >= 768) {
        setViewMode(ViewMode.Split);
      }
      
      setShowToast({ message: 'Diagram successfully scanned!', visible: true });
      setTimeout(() => setShowToast({ message: '', visible: false }), 3000);
  };

  // Audit Handler
  const handleAudit = async () => {
      setIsAuditModalOpen(true);
      setIsAuditing(true);
      setAuditReport(null); // Reset previous report

      try {
          const report = await auditDiagram(code);
          setAuditReport(report);
      } catch (e) {
          console.error(e);
          setShowToast({ message: 'Audit failed. Please try again.', visible: true });
          setTimeout(() => setShowToast({ message: '', visible: false }), 3000);
          setIsAuditModalOpen(false);
      } finally {
          setIsAuditing(false);
      }
  };

  // --- 9. Export/Share Handlers ---

  const handleShare = () => {
    const hash = encodeCodeToUrl(code);
    let shareUrl = window.location.href.split('#')[0];
    if (shareUrl.endsWith('/')) {
        shareUrl = shareUrl.slice(0, -1);
    }
    const fullUrl = `${shareUrl}#${hash}`;

    navigator.clipboard.writeText(fullUrl).then(() => {
        setShowToast({ message: 'Link copied to clipboard', visible: true });
        setTimeout(() => setShowToast({ message: '', visible: false }), 3000);
    }).catch(e => {
        console.error("Clipboard failed", e);
    });
  };

  const getSvgData = () => {
    const container = document.getElementById('diagram-output-container');
    const svg = container?.querySelector('svg');
    if (!svg) return null;

    // Clone to safely modify
    const clone = svg.cloneNode(true) as SVGElement;
    
    // Get natural dimensions
    let width = 0, height = 0;
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

    // Explicitly set width/height on clone for export consistency
    clone.setAttribute('width', width.toString());
    clone.setAttribute('height', height.toString());
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Apply Background Color
    const bgColor = customStyle.backgroundColor || (theme === 'neutral' ? '#ffffff' : '#131316');
    clone.style.backgroundColor = bgColor;

    return { clone, width, height, bgColor };
  };

  const handleExportSvg = () => {
    const data = getSvgData();
    if (!data) {
        setShowToast({ message: 'Export failed: No diagram found', visible: true });
        return;
    }
    const { clone } = data;

    try {
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
        console.error("SVG Export failed:", e);
        setShowToast({ message: 'SVG Export failed', visible: true });
    }
  };

  const handleExportPng = () => {
    const data = getSvgData();
    if (!data) return;
    const { clone, width, height, bgColor } = data;

    try {
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // High resolution export
        const scale = 3; 
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Draw background explicitly on canvas (safer than SVG background for PNG)
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const link = document.createElement('a');
            link.download = `archigram-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = (e) => {
          console.error("Image load error for PNG export", e);
          setShowToast({ message: 'PNG Generation failed', visible: true });
          URL.revokeObjectURL(url);
      }
      img.src = url;
    } catch (e) {
      console.error("PNG Export failed:", e);
      setShowToast({ message: 'PNG Export failed', visible: true });
    }
  };
  
  // Publish Handlers
  const openPublishModal = () => {
      const activeP = projects.find(p => p.id === activeProjectId);
      setPublishData({
          title: activeP?.name || '',
          author: localStorage.getItem('archigram_author') || '',
          description: '',
          tags: ''
      });
      setIsPublishModalOpen(true);
  };

  const submitPublish = async () => {
      if (!publishData.title.trim() || !code.trim()) return;

      setIsPublishing(true);
      
      // Save author for next time
      if(publishData.author) localStorage.setItem('archigram_author', publishData.author);

      const tagsArray = publishData.tags.split(',').map(t => t.trim()).filter(Boolean);

      const success = await publishDiagram({
          title: publishData.title,
          author: publishData.author || 'Anonymous',
          description: publishData.description,
          code: code,
          tags: tagsArray
      });

      setIsPublishing(false);

      if (success) {
          setIsPublishModalOpen(false);
          setShowToast({ message: 'Diagram successfully published to Gallery!', visible: true });
          setTimeout(() => setShowToast({ message: '', visible: false }), 4000);
      } else {
          setShowToast({ message: 'Failed to publish. Try again.', visible: true });
          setTimeout(() => setShowToast({ message: '', visible: false }), 3000);
      }
  };

  // Syntax Fix Handler
  const handleFixError = async () => {
      if (!code || !error) return;
      
      setIsFixing(true);
      try {
          const { fixDiagramSyntax } = await import('./services/geminiService.ts');
          const fixedCode = await fixDiagramSyntax(code, error);
          if (fixedCode) {
              setCode(fixedCode);
              handleAIUpdate(fixedCode); // Save to history
              setError(null); // Clear error immediately (re-render will verify)
              setShowToast({ message: 'Syntax error auto-corrected', visible: true });
              setTimeout(() => setShowToast({ message: '', visible: false }), 3000);
          }
      } catch (e) {
          console.error("Auto-fix failed:", e);
          setShowToast({ message: 'Failed to fix code automatically.', visible: true });
          setTimeout(() => setShowToast({ message: '', visible: false }), 3000);
      } finally {
          setIsFixing(false);
      }
  };


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const activeProject = projects.find(p => p.id === activeProjectId);

  // Inject Theme Variables
  const appStyle = THEMES[theme] || THEMES.dark;

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
            <CommunityGallery onNavigate={setCurrentView} onFork={handleFork} />
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
        />
      </Suspense>

      <main className="flex-1 flex overflow-hidden relative">
        
        {isSidebarOpen && (
            <div className={`
                hidden md:block h-full relative z-10 transition-[width] duration-300 ease-in-out
                ${isSidebarCollapsed ? 'w-[70px]' : 'w-72'}
            `}>
                <Suspense fallback={<div className="w-full h-full bg-surface/80 border-r border-border"></div>}>
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
             <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
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
          <div className={`
            flex flex-col transition-all duration-300 ease-in-out border-r border-border
            ${viewMode === ViewMode.Split ? 'w-1/3' : 'w-full'}
          `}>
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
          <div className={`${viewMode === ViewMode.Split ? 'w-2/3' : 'w-full'} bg-surface/50 relative`}>
            <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            }>
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
                />
            </Suspense>
          </div>
        )}
      </main>

      {/* Confirmation Modal for Deletion */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100 animate-slide-up">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text">Delete Project?</h3>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden animate-slide-up ring-1 ring-white/10">
                <div className="flex items-center justify-between p-4 border-b border-border bg-surface-hover/30">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-primary" />
                        Publish to Community
                    </h3>
                    <button 
                        onClick={() => setIsPublishModalOpen(false)}
                        className="text-text-muted hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Title</label>
                        <input 
                            type="text"
                            value={publishData.title}
                            onChange={e => setPublishData({...publishData, title: e.target.value})}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="My Awesome Diagram"
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Author Name</label>
                        <input 
                            type="text"
                            value={publishData.author}
                            onChange={e => setPublishData({...publishData, author: e.target.value})}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Your Name (Optional)"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
                        <textarea 
                            value={publishData.description}
                            onChange={e => setPublishData({...publishData, description: e.target.value})}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
                            placeholder="Briefly describe what this diagram shows..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Tags (Comma Separated)</label>
                        <input 
                            type="text"
                            value={publishData.tags}
                            onChange={e => setPublishData({...publishData, tags: e.target.value})}
                            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Architecture, API, Flowchart..."
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-surface-hover/30 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsPublishModalOpen(false)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={submitPublish}
                        disabled={isPublishing || !publishData.title.trim()}
                        className="px-6 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isPublishing ? 'Publishing...' : 'Publish Diagram'}
                    </button>
                </div>
            </div>
          </div>
      )}

      {showToast.visible && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-surface border border-primary/30 text-primary px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">{showToast.message}</span>
          </div>
      )}
    </div>
  );
}

export default App;
