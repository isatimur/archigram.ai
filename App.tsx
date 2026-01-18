import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import CodeEditor from './components/CodeEditor.tsx';
import DiagramPreview from './components/DiagramPreview.tsx';
import AIChat from './components/AIChat.tsx';
import { INITIAL_CODE, STORAGE_KEY } from './constants.ts';
import { ViewMode, DiagramTheme } from './types.ts';
import { encodeCodeToUrl, decodeCodeFromUrl } from './utils/url.ts';
import { CheckCircle2 } from 'lucide-react';

function App() {
  // --- 1. State Management ---
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [history, setHistory] = useState<string[]>([INITIAL_CODE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<DiagramTheme>('dark');
  const [showToast, setShowToast] = useState(false);
  
  // State for navigating from diagram to code
  const [selectionRequest, setSelectionRequest] = useState<{ text: string; ts: number } | null>(null);

  // --- 2. Initialization & Effects ---
  
  // Initialize from URL or LocalStorage
  useEffect(() => {
    // 1. Check URL Hash for shared code
    const hash = window.location.hash.slice(1); // remove #
    if (hash) {
      const decoded = decodeCodeFromUrl(hash);
      if (decoded) {
        setCode(decoded);
        setHistory([decoded]);
        // Clear hash to clean URL but keep state? Optional. 
        // window.location.hash = ''; 
        return;
      }
    }

    // 2. Fallback to Local Storage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCode(saved);
      setHistory([saved]);
    }
  }, []);

  // Responsive default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode(ViewMode.Preview);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Init
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persistence effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
  }, [code]);

  // --- 3. Undo/Redo Logic ---
  useEffect(() => {
      if (code === history[historyIndex]) return;

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
          if (code !== history[historyIndex]) {
             setCode(history[historyIndex]);
          } else {
             const newIndex = historyIndex - 1;
             setHistoryIndex(newIndex);
             setCode(history[newIndex]);
          }
      } else if (code !== history[historyIndex]) {
          setCode(history[historyIndex]);
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

  // --- 4. Feature Handlers ---

  const handleShare = () => {
    const hash = encodeCodeToUrl(code);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    
    // Update URL bar immediately
    window.history.replaceState(null, '', `#${hash}`);
    
    navigator.clipboard.writeText(url).then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    });
  };

  const handleSelectTemplate = (templateCode: string) => {
      handleAIUpdate(templateCode); // Use AI update to push to history immediately
  };

  const handleDiagramElementClick = (text: string) => {
      // Trigger selection request
      setSelectionRequest({ text, ts: Date.now() });
      
      // If we are in preview-only mode, switch to split to show where we jumped
      if (viewMode === ViewMode.Preview) {
          setViewMode(ViewMode.Split);
      }
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
        link.download = `archigraph-${Date.now()}.svg`;
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
        
        // Handle viewbox or bounding rect
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

        const scale = 3; // High res
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Determine BG based on theme (approximate)
            ctx.fillStyle = theme === 'base' || theme === 'neutral' ? '#ffffff' : '#131316'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const link = document.createElement('a');
            link.download = `archigraph-${Date.now()}.png`;
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

  const canUndo = historyIndex > 0 || code !== history[historyIndex];
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-zinc-200 overflow-hidden font-sans">
      <Header 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        currentTheme={theme}
        setTheme={setTheme}
        onSelectTemplate={handleSelectTemplate}
        onShare={handleShare}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {/* Editor Pane */}
        {(viewMode === ViewMode.Split || viewMode === ViewMode.Code) && (
          <div className={`${viewMode === ViewMode.Split ? 'w-1/3 border-r border-zinc-800' : 'w-full'} flex flex-col transition-all duration-300 ease-in-out`}>
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

        {/* Preview Pane */}
        {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
          <div className={`${viewMode === ViewMode.Split ? 'w-2/3' : 'w-full'} bg-surface relative`}>
            <DiagramPreview 
                code={code} 
                onError={setError} 
                theme={theme} 
                onElementClick={handleDiagramElementClick}
            />
            
            {/* AI Overlay */}
            <AIChat currentCode={code} onCodeUpdate={handleAIUpdate} />
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {showToast && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-green-500/30 text-green-400 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 z-50 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Link copied to clipboard</span>
          </div>
      )}
    </div>
  );
}

export default App;