import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Maximize, AlertCircle, Move, RotateCcw, Box, MousePointer2 } from 'lucide-react';
import { DiagramTheme } from '../types';

interface DiagramPreviewProps {
  code: string;
  onError: (error: string | null) => void;
  theme: DiagramTheme;
}

interface TooltipData {
  x: number;
  y: number;
  content: string;
  type: string;
  id?: string;
}

const DiagramPreview: React.FC<DiagramPreviewProps> = ({ code, onError, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Re-initialize mermaid when theme changes
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme,
      securityLevel: 'loose',
      fontFamily: '"Inter", sans-serif',
      themeVariables: {
        fontFamily: '"Inter", sans-serif',
      }
    });
    // Force re-render by clearing content momentarily
    setSvgContent(''); 
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!code) return;
      
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        
        if (isMounted) {
          setSvgContent(svg);
          onError(null);
        }
      } catch (err) {
        if (isMounted) {
            const msg = err instanceof Error ? err.message : "Syntax Error";
            const textMatch = (err as any)?.str || msg;
            onError(textMatch);
        }
      }
    };

    renderDiagram();
    return () => { isMounted = false; };
  }, [code, theme, onError]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
    setTooltip(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Panning Handling
    if (isPanning) {
      setPosition({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
      return;
    }

    // 2. Tooltip Handling (Element Detection)
    const target = e.target as Element;
    
    const group = target.closest('.node, .actor, .messageText, .classTitle, .task, .cluster, .statediagram-state');

    if (group) {
        // Try to find text content
        let content = '';
        let type = 'Element';
        let id = group.id;

        // Determine Type & Content
        if (group.classList.contains('actor')) {
            type = 'Participant';
            const textEl = group.querySelector('text');
            content = textEl?.textContent || '';
        } else if (group.classList.contains('node') || group.classList.contains('statediagram-state')) {
            type = 'Node';
            const div = group.querySelector('div');
            const textEl = group.querySelector('text');
            content = div?.textContent || textEl?.textContent || '';
        } else if (group.classList.contains('messageText')) {
            type = 'Message';
            content = group.textContent || '';
        } else if (group.classList.contains('task')) {
            type = 'Task';
            const textEl = group.querySelector('text');
            content = textEl?.textContent || '';
        } else if (group.classList.contains('cluster')) {
            type = 'Subgraph';
            const textEl = group.querySelector('.cluster-label');
            content = textEl?.textContent || 'Cluster';
        }

        content = content.trim();

        if (content) {
            setTooltip({
                x: e.clientX,
                y: e.clientY,
                content,
                type,
                id: id || undefined
            });
        } else {
            setTooltip(null);
        }
    } else {
        setTooltip(null);
    }
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => {
      setIsPanning(false);
      setTooltip(null);
  };

  const resetView = () => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
  }

  // Calculate smart position to avoid clipping
  const getTooltipStyle = () => {
    if (!tooltip) return {};
    const OFFSET = 16;
    const WIDTH = 240; // Max width approx
    const HEIGHT = 100; // Est height

    let left = tooltip.x + OFFSET;
    let top = tooltip.y + OFFSET;

    // Flip horizontally if too close to right edge
    if (left + WIDTH > window.innerWidth) {
        left = tooltip.x - WIDTH - OFFSET;
    }

    // Flip vertically if too close to bottom edge
    if (top + HEIGHT > window.innerHeight) {
        top = tooltip.y - HEIGHT - OFFSET;
    }

    return { left, top, maxWidth: `${WIDTH}px` };
  };

  return (
    <div className="relative w-full h-full bg-[#131316] overflow-hidden flex flex-col select-none">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }}>
      </div>

      {/* Architect's HUD (Heads-Up Display) */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-1 glass-panel rounded-xl p-1.5 shadow-2xl animate-fade-in">
         <div className="flex flex-col gap-1 items-center">
            <button 
                onClick={() => setScale(s => Math.min(s + 0.1, 5))}
                className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Zoom In"
            >
                <ZoomIn className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-mono text-zinc-500 font-medium">{Math.round(scale * 100)}%</div>
            <button 
                onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
                className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                title="Zoom Out"
            >
                <ZoomOut className="w-4 h-4" />
            </button>
         </div>
         <div className="w-full h-px bg-white/10 my-1"></div>
         <button 
            onClick={resetView}
            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Reset View"
         >
            <RotateCcw className="w-4 h-4" />
         </button>
      </div>

      {/* Render Area */}
      <div 
        className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div 
            id="diagram-output-container"
            ref={containerRef}
            className="absolute origin-center transition-transform duration-75 ease-linear will-change-transform"
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                minWidth: '100%',
                minHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '100px'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        
        {/* Placeholder if empty */}
        {!svgContent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 animate-pulse">
                 <Box className="w-12 h-12 mb-4 opacity-20" />
                 <p className="font-mono text-sm tracking-widest uppercase opacity-50">Rendering Diagram...</p>
            </div>
        )}
      </div>
      
      {/* Interactive Tooltip */}
      {tooltip && (
        <div 
            className="fixed z-50 flex flex-col gap-1 px-3 py-2 bg-zinc-900/80 border border-white/10 text-white rounded-lg shadow-2xl backdrop-blur-xl pointer-events-none animate-fade-in ring-1 ring-white/5"
            style={getTooltipStyle()}
        >
            <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-0.5">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
                    <MousePointer2 className="w-3 h-3" />
                    {tooltip.type}
                </span>
                {tooltip.id && !tooltip.id.startsWith('mermaid-') && (
                    <span className="text-[9px] font-mono text-zinc-500">#{tooltip.id}</span>
                )}
            </div>
            <span className="text-xs font-medium text-zinc-200 leading-relaxed break-words font-sans">
                {tooltip.content}
            </span>
        </div>
      )}

      {/* Legend / Info Overlay */}
      <div className="absolute bottom-6 right-6 pointer-events-none opacity-40">
        <p className="text-[10px] font-mono text-white text-right">
            X: {Math.round(position.x)} Y: {Math.round(position.y)}
        </p>
      </div>
    </div>
  );
};

export default DiagramPreview;