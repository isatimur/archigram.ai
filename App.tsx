import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import CodeEditor from './components/CodeEditor.tsx';
import DiagramPreview from './components/DiagramPreview.tsx';
import AIChat from './components/AIChat.tsx';
import LandingPage from './components/LandingPage.tsx';
import Sidebar from './components/Sidebar.tsx';
import { INITIAL_CODE, STORAGE_KEY } from './constants.ts';
import { ViewMode, DiagramTheme, AppView, Project } from './types.ts';
import { encodeCodeToUrl, decodeCodeFromUrl } from './utils/url.ts';
import { CheckCircle2, Menu } from 'lucide-react';

const PROJECTS_STORAGE_KEY = 'archigram_projects';

// Theme Configuration for CSS Variables
const THEMES: Record<DiagramTheme, React.CSSProperties> = {
  dark: {
    '--bg': '9 9 11',              // zinc-950
    '--surface': '24 24 27',       // zinc-900
    '--surface-hover': '39 39 42', // zinc-800
    '--border': '63 63 70',        // zinc-700
    '--text': '228 228 231',       // zinc-200
    '--text-muted': '161 161 170', // zinc-400
    '--primary': '99 102 241',     // indigo-500
    '--primary-hover': '79 70 229',// indigo-600
  } as any,
  forest: {
    '--bg': '2 4 4',               // dark green/black
    '--surface': '6 25 18',        // deep green
    '--surface-hover': '10 40 30',
    '--border': '20 83 45',        // emerald-800
    '--text': '236 253 245',       // emerald-50
    '--text-muted': '110 231 183', // emerald-300
    '--primary': '16 185 129',     // emerald-500
    '--primary-hover': '5 150 105',
  } as any,
  neutral: {
    '--bg': '255 255 255',         // white
    '--surface': '244 244 245',    // zinc-100
    '--surface-hover': '228 228 231', // zinc-200
    '--border': '212 212 216',     // zinc-300
    '--text': '24 24 27',          // zinc-900
    '--text-muted': '82 82 91',    // zinc-600
    '--primary': '37 99 235',      // blue-600
    '--primary-hover': '29 78 216',
  } as any,
  base: {
    '--bg': '255 255 255',
    '--surface': '248 250 252',    // slate-50
    '--surface-hover': '241 245 249', // slate-100
    '--border': '203 213 225',     // slate-300
    '--text': '15 23 42',          // slate-900
    '--text-muted': '71 85 105',   // slate-600
    '--primary': '79 70 229',      // indigo-600
    '--primary-hover': '67 56 202',
  } as any,
};

function App() {
  // --- 1. App Level State ---
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- 2. Editor Level State ---
  const [code, setCode] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<DiagramTheme>('dark');
  const [showToast, setShowToast] = useState(false);
  const [selectionRequest, setSelectionRequest] = useState<{ text: string; ts: number } | null>(null);

  // --- 3. Initialization Logic ---
  
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
                    updatedAt: Date.now()
                };
                loadedProjects.push(legacyProject);
                localStorage.removeItem(STORAGE_KEY);
            }

            if (loadedProjects.length === 0) {
                loadedProjects.push({
                    id: 'init-' + Date.now(),
                    name: 'Swiirl System Flow',
                    code: INITIAL_CODE,
                    updatedAt: Date.now()
                });
            }

            setProjects(loadedProjects);
            
            if (loadedProjects.length > 0) {
                const mostRecent = loadedProjects.sort((a,b) => b.updatedAt - a.updatedAt)[0];
                setActiveProjectId(mostRecent.id);
                setCode(mostRecent.code);
                setHistory([mostRecent.code]);
            }
        } catch (e) {
            console.error("Failed to load projects", e);
            setProjects([{ id: 'err', name: 'New Diagram', code: INITIAL_CODE, updatedAt: Date.now() }]);
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
                updatedAt: Date.now()
            };
            setProjects(prev => [sharedProject, ...prev]);
            setActiveProjectId(sharedProject.id);
            setCode(decoded);
            setHistory([decoded]);
            window.location.hash = '';
        }
    }

  }, []);

  // --- 4. Persistence & Project Management ---

  useEffect(() => {
     if (projects.length > 0) {
         localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
     }
  }, [projects]);

  useEffect(() => {
    if (!activeProjectId) return;

    setProjects(prev => prev.map(p => {
        if (p.id === activeProjectId && p.code !== code) {
            return { ...p, code, updatedAt: Date.now() };
        }
        return p;
    }));
  }, [code, activeProjectId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode(ViewMode.Preview);
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 5. Undo/Redo Logic ---
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

  const handleAIUpdate = (newCode: string) => {
      setHistory(prev => {
          const upToCurrent = prev.slice(0, historyIndex + 1);
          return [...upToCurrent, newCode];
      });
      setHistoryIndex(prev => prev + 1);
      setCode(newCode);
  };

  // --- 6. Project Actions ---

  const handleCreateProject = () => {
      const newProject: Project = {
          id: Date.now().toString(),
          name: `Diagram ${projects.length + 1}`,
          code: `graph TD\n    A[Start] --> B[Process]\n    B --> C[End]`,
          updatedAt: Date.now()
      };
      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      setCode(newProject.code);
      setHistory([newProject.code]);
      setHistoryIndex(0);
      
      if (window.innerWidth >= 768) {
        setViewMode(ViewMode.Split);
      }
  };

  const handleSelectProject = (id: string) => {
      const project = projects.find(p => p.id === id);
      if (project) {
          setActiveProjectId(id);
          setCode(project.code);
          setHistory([project.code]);
          setHistoryIndex(0);
      }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (projects.length <= 1) {
          alert("Cannot delete the last project.");
          return;
      }
      
      if (confirm("Are you sure you want to delete this diagram?")) {
          const newProjects = projects.filter(p => p.id !== id);
          setProjects(newProjects);
          
          if (activeProjectId === id) {
              handleSelectProject(newProjects[0].id);
          }
      }
  };

  // --- 7. Export/Share Handlers ---

  const handleShare = () => {
    const hash = encodeCodeToUrl(code);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    window.history.replaceState(null, '', `#${hash}`);
    navigator.clipboard.writeText(url).then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    });
  };

  const getSvgElement = () => {
    const container = document.getElementById('diagram-output-container');
    const svg = container?.querySelector('svg');
    if (!svg) {
      console.error("Export failed: No SVG element found.");
      return null;
    }
    return { svg, container };
  };

  const handleExportSvg = () => {
    const result = getSvgElement();
    if (!result) return;
    const { svg } = result;

    try {
        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `archigram-${Date.now()}.svg`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("SVG Export failed:", e);
    }
  };

  const handleExportPng = () => {
    const result = getSvgElement();
    if (!result) return;
    const { svg, container } = result;

    try {
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number);
        let width = 0;
        let height = 0;

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

        const scale = 3; 
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = theme === 'base' || theme === 'neutral' ? '#ffffff' : '#131316'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const link = document.createElement('a');
            link.download = `archigram-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e) {
      console.error("PNG Export failed:", e);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  if (currentView === 'landing') {
      return <LandingPage onLaunch={() => setCurrentView('app')} />;
  }

  // Inject Theme Variables
  const appStyle = THEMES[theme] || THEMES.dark;

  return (
    <div 
        className="h-screen w-screen flex flex-col bg-background text-text overflow-hidden font-sans transition-colors duration-500"
        style={appStyle}
    >
      <Header 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        currentTheme={theme}
        setTheme={setTheme}
        onShare={handleShare}
        onNewProject={handleCreateProject}
      />

      <main className="flex-1 flex overflow-hidden relative">
        
        {isSidebarOpen && (
            <div className="hidden md:block">
                <Sidebar 
                    projects={projects}
                    activeProjectId={activeProjectId}
                    onSelectProject={handleSelectProject}
                    onCreateProject={handleCreateProject}
                    onDeleteProject={handleDeleteProject}
                />
            </div>
        )}

        {!isSidebarOpen && (
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 z-20 p-2 bg-surface hover:bg-surface-hover rounded-md text-text-muted hover:text-text border border-border shadow-md"
             >
                 <Menu className="w-4 h-4" />
             </button>
        )}

        {(viewMode === ViewMode.Split || viewMode === ViewMode.Code) && (
          <div className={`
            flex flex-col transition-all duration-300 ease-in-out border-r border-border
            ${viewMode === ViewMode.Split ? 'w-1/3' : 'w-full'}
            ${!isSidebarOpen ? '' : ''}
          `}>
            <CodeEditor 
                code={code} 
                onChange={setCode}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                error={error}
                selectionRequest={selectionRequest}
            />
          </div>
        )}

        {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
          <div className={`${viewMode === ViewMode.Split ? 'w-2/3' : 'w-full'} bg-surface/50 relative`}>
            <DiagramPreview 
                code={code} 
                onError={setError} 
                theme={theme} 
                onElementClick={(text) => {
                     setSelectionRequest({ text, ts: Date.now() });
                     if (viewMode === ViewMode.Preview) setViewMode(ViewMode.Split);
                }}
            />
            
            <AIChat 
                currentCode={code} 
                onCodeUpdate={handleAIUpdate} 
                theme={theme}
            />
          </div>
        )}
      </main>

      {showToast && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-surface border border-primary/30 text-primary px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Link copied to clipboard</span>
          </div>
      )}
    </div>
  );
}

export default App;