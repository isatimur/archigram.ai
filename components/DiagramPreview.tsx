import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Maximize, AlertCircle, Move, RotateCcw, Box, MousePointer2, Minus, Plus } from 'lucide-react';
import { DiagramTheme, DiagramStyleConfig } from '../types.ts';

interface DiagramPreviewProps {
  code: string;
  onError: (error: string | null) => void;
  theme: DiagramTheme;
  customStyle?: DiagramStyleConfig;
  onElementClick?: (text: string) => void;
}

interface TooltipData {
  x: number;
  y: number;
  content: string;
  type: string;
  id?: string;
}

const DiagramPreview: React.FC<DiagramPreviewProps> = ({ code, onError, theme, customStyle, onElementClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isHoveringElement, setIsHoveringElement] = useState(false);
  const [iconsLoaded, setIconsLoaded] = useState(false);
  
  // Track dragging to distinguish from clicking
  const hasDragged = useRef(false);

  // 1. Initialize Icons (Run Once)
  useEffect(() => {
    const registerIcons = async () => {
        try {
            await mermaid.registerIconPacks([
                {
                    name: 'logos',
                    loader: () => fetch('https://unpkg.com/@iconify-json/logos@1/icons.json').then(res => res.json())
                },
                {
                    name: 'aws',
                    loader: () => fetch('https://unpkg.com/@iconify-json/aws@1/icons.json').then(res => res.json())
                },
                {
                    name: 'gcp',
                    loader: () => fetch('https://unpkg.com/@iconify-json/google-cloud-icons@1/icons.json').then(res => res.json())
                },
                {
                    name: 'azure',
                    loader: () => fetch('https://unpkg.com/@iconify-json/azure@1/icons.json').then(res => res.json())
                },
                {
                    name: 'fa', // Font Awesome Regular
                    loader: () => fetch('https://unpkg.com/@iconify-json/fa6-regular@1/icons.json').then(res => res.json())
                },
                {
                    name: 'fas', // Font Awesome Solid
                    loader: () => fetch('https://unpkg.com/@iconify-json/fa6-solid@1/icons.json').then(res => res.json())
                },
                {
                    name: 'material', // Material Design
                    loader: () => fetch('https://unpkg.com/@iconify-json/material-symbols@1/icons.json').then(res => res.json())
                }
            ]);
            setIconsLoaded(true);
        } catch (e) {
            console.error("Failed to register icon packs", e);
            // Continue anyway, icons might just be missing
            setIconsLoaded(true);
        }
    };
    registerIcons();
  }, []);

  // 2. Initialize Mermaid Config (Run on Theme Change)
  useEffect(() => {
    // Map custom themes to standard Mermaid themes
    const mermaidTheme = theme === 'midnight' ? 'dark' : theme;

    const themeVariables: any = {
        fontFamily: '"Inter", sans-serif',
        // High-Fidelity Sequence Diagram Colors (Indigo/Midnight Palette)
        actorBkg: '#1e1e24',
        actorBorder: '#6366f1',
        actorTextColor: '#eef2ff',
        actorLineColor: '#818cf8',
        signalColor: '#a5b4fc',
        signalTextColor: '#eef2ff',
        labelBoxBkgColor: '#1e1e24',
        labelBoxBorderColor: '#818cf8',
        noteBkgColor: 'rgba(99, 102, 241, 0.1)',
        noteBorderColor: 'rgba(99, 102, 241, 0.3)',
        noteTextColor: '#c7d2fe',
        loopTextColor: '#c7d2fe',
        activationBorderColor: '#6366f1',
        activationBkgColor: '#312e81',
        sequenceNumberColor: '#ffffff'
    };

    if (customStyle) {
        if (customStyle.nodeColor) {
            themeVariables.primaryColor = customStyle.nodeColor;
            themeVariables.primaryBorderColor = customStyle.nodeColor;
            themeVariables.mainBkg = customStyle.nodeColor;
            themeVariables.actorBkg = customStyle.nodeColor;
            themeVariables.actorBorder = customStyle.nodeColor;
        }
        if (customStyle.lineColor) {
            themeVariables.lineColor = customStyle.lineColor;
            themeVariables.arrowheadColor = customStyle.lineColor;
            themeVariables.actorLineColor = customStyle.lineColor;
            themeVariables.signalColor = customStyle.lineColor;
        }
        if (customStyle.textColor) {
            themeVariables.textColor = customStyle.textColor;
            themeVariables.actorTextColor = customStyle.textColor;
            themeVariables.signalTextColor = customStyle.textColor;
            themeVariables.noteTextColor = customStyle.textColor;
        }
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose',
      fontFamily: '"Inter", sans-serif',
      themeVariables: themeVariables,
      sequence: {
          showSequenceNumbers: false,
          actorMargin: 50,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
          mirrorActors: false,
          bottomMarginAdj: 1,
          useMaxWidth: true,
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    });

    // Force re-render by clearing content momentarily
    setSvgContent(''); 
  }, [theme, customStyle]);

  useEffect(() => {
    let isMounted = true;
    
    const renderDiagram = async () => {
      if (!code || !iconsLoaded) return;
      
      try {
        const id = `mermaid-${Date.now()}`;
        // Using mermaid.render directly. 
        // Note: mermaid.render returns an object { svg } in v10+
        const { svg } = await mermaid.render(id, code);
        
        if (isMounted) {
          setSvgContent(svg);
          onError(null);
        }
      } catch (err) {
        if (isMounted) {
            console.error("Mermaid Render Error:", err);
            const msg = err instanceof Error ? err.message : "Syntax Error";
            // Mermaid sometimes returns an object with 'str' property for errors
            const textMatch = (err as any)?.str || msg;
            onError(textMatch);
        }
      }
    };

    renderDiagram();
    return () => { isMounted = false; };
  }, [code, theme, customStyle, onError, iconsLoaded]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
    setTooltip(null);
    hasDragged.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Panning Handling
    if (isPanning) {
      hasDragged.current = true;
      setPosition({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
      return;
    }

    // 2. Tooltip Handling (Element Detection)
    const target = e.target as Element;
    
    // Updated selector to include new architecture diagram classes if known, 
    // though generic svg classes usually work.
    const group = target.closest('.node, .actor, .messageText, .classTitle, .task, .cluster, .statediagram-state, .icon');

    if (group) {
        setIsHoveringElement(true);
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
            // Sometimes text is nested
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
        } else if (group.tagName === 'g' && group.getAttribute('title')) {
            // Some arch diagrams might use title attrs
             content = group.getAttribute('title') || '';
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
            setIsHoveringElement(false);
        }
    } else {
        setTooltip(null);
        setIsHoveringElement(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current || !onElementClick) return;

    const target = e.target as Element;
    const group = target.closest('.node, .actor, .messageText, .classTitle, .task, .cluster, .statediagram-state');

    if (group) {
        let content = '';
        if (group.classList.contains('actor')) {
            const textEl = group.querySelector('text');
            content = textEl?.textContent || '';
        } else if (group.classList.contains('node') || group.classList.contains('statediagram-state')) {
            const div = group.querySelector('div');
            const textEl = group.querySelector('text');
            content = div?.textContent || textEl?.textContent || '';
        } else if (group.classList.contains('messageText')) {
            content = group.textContent || '';
        } else if (group.classList.contains('task')) {
            const textEl = group.querySelector('text');
            content = textEl?.textContent || '';
        } else if (group.classList.contains('cluster')) {
            const textEl = group.querySelector('.cluster-label');
            content = textEl?.textContent || '';
        }

        content = content.trim();
        if (content) {
            onElementClick(content);
        }
    }
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => {
      setIsPanning(false);
      setTooltip(null);
      setIsHoveringElement(false);
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
    <div className="relative w-full h-full bg-[#131316] overflow-hidden flex flex-col select-none group/canvas">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', 
             backgroundSize: '20px 20px' 
           }}>
      </div>

      {/* Render Area */}
      <div 
        className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : isHoveringElement ? 'cursor-pointer' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
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
        {(!svgContent && !iconsLoaded) && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 animate-pulse">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-mono text-sm tracking-widest uppercase opacity-50">Initializing Icons...</p>
           </div>
        )}

        {(!svgContent && iconsLoaded) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 animate-pulse">
                 <Box className="w-12 h-12 mb-4 opacity-20" />
                 <p className="font-mono text-sm tracking-widest uppercase opacity-50">Rendering Diagram...</p>
            </div>
        )}
      </div>

      {/* Architect's HUD (Heads-Up Display) - Bottom Floating Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5 shadow-2xl animate-slide-up ring-1 ring-black/20 transition-all opacity-0 group-hover/canvas:opacity-100 hover:!opacity-100 duration-300">
         
         <button 
            onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
            title="Zoom Out"
         >
            <Minus className="w-4 h-4" />
         </button>
         
         <div 
            className="px-2 w-12 text-center text-xs font-mono text-zinc-300 font-medium cursor-pointer hover:text-white transition-colors select-none"
            onClick={resetView}
            title="Click to Reset"
         >
            {Math.round(scale * 100)}%
         </div>
         
         <button 
            onClick={() => setScale(s => Math.min(s + 0.1, 5))}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
            title="Zoom In"
         >
            <Plus className="w-4 h-4" />
         </button>

         <div className="w-px h-4 bg-white/10 mx-1"></div>
         
         <button 
            onClick={resetView}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
            title="Reset View"
         >
            <RotateCcw className="w-3.5 h-3.5" />
         </button>
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

      {/* Legend / Info Overlay - Fades out when idle */}
      <div className="absolute bottom-6 right-6 pointer-events-none opacity-0 group-hover/canvas:opacity-40 transition-opacity duration-300">
        <p className="text-[10px] font-mono text-white text-right">
            X: {Math.round(position.x)} Y: {Math.round(position.y)}
        </p>
      </div>
    </div>
  );
};

export default DiagramPreview;