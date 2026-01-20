import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { 
    ZoomIn, ZoomOut, Maximize, AlertCircle, Move, RotateCcw, 
    Box, MousePointer2, Minus, Plus, Settings2, Palette, 
    Grid, Layout, Eye, Download, Image as ImageIcon 
} from 'lucide-react';
import { DiagramTheme, DiagramStyleConfig, BackgroundPattern, DiagramLook } from '../types.ts';

interface DiagramPreviewProps {
  code: string;
  onError: (error: string | null) => void;
  theme: DiagramTheme;
  customStyle?: DiagramStyleConfig;
  onUpdateStyle?: (style: DiagramStyleConfig) => void; 
  onElementClick?: (text: string) => void;
  showControls?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  content: string;
  type: string;
  id?: string;
}

// Preset Configurations
const STYLE_PRESETS: Record<string, DiagramStyleConfig> = {
    'Professional': {
        backgroundPattern: 'dots',
        backgroundColor: '#131316',
        backgroundOpacity: 1,
        diagramLook: 'classic',
        lineColor: '#6366f1',
        textColor: '#e4e4e7',
        nodeColor: '#1e1e24'
    },
    'Blueprint': {
        backgroundPattern: 'grid',
        backgroundColor: '#1e3a8a', // Deep Blue
        backgroundOpacity: 1,
        diagramLook: 'handDrawn',
        lineColor: '#ffffff',
        textColor: '#ffffff',
        nodeColor: 'rgba(255,255,255,0.1)'
    },
    'Cyberpunk': {
        backgroundPattern: 'crossline',
        backgroundColor: '#09090b',
        backgroundOpacity: 1,
        diagramLook: 'classic',
        lineColor: '#00ff9d', // Neon Green
        textColor: '#00ff9d',
        nodeColor: '#000000'
    },
    'Paper': {
        backgroundPattern: 'solid',
        backgroundColor: '#f5f5f4', // Warm Grey
        backgroundOpacity: 1,
        diagramLook: 'handDrawn',
        lineColor: '#292524',
        textColor: '#292524',
        nodeColor: '#ffffff'
    }
};

const DiagramPreview: React.FC<DiagramPreviewProps> = ({ code, onError, theme, customStyle, onUpdateStyle, onElementClick, showControls = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isHoveringElement, setIsHoveringElement] = useState(false);
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  // HUD State
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const hasDragged = useRef(false);

  // Default Style Merging
  const activeStyle: DiagramStyleConfig = {
      ...STYLE_PRESETS['Professional'],
      ...customStyle
  };

  // 0. Lazy Loading Observer
  useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
              setShouldRender(true);
              observer.disconnect(); // Render once and stay rendered
          }
      }, { rootMargin: '300px' }); // Start rendering when 300px away from viewport

      if (containerRef.current) {
          observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
  }, []);

  // 1. Initialize Icons (Run Once)
  useEffect(() => {
    const registerIcons = async () => {
        try {
            await mermaid.registerIconPacks([
                { name: 'logos', loader: () => fetch('https://unpkg.com/@iconify-json/logos@1/icons.json').then(res => res.json()) },
                { name: 'aws', loader: () => fetch('https://unpkg.com/@iconify-json/aws@1/icons.json').then(res => res.json()) },
                { name: 'gcp', loader: () => fetch('https://unpkg.com/@iconify-json/google-cloud-icons@1/icons.json').then(res => res.json()) },
                { name: 'azure', loader: () => fetch('https://unpkg.com/@iconify-json/azure@1/icons.json').then(res => res.json()) },
                { name: 'fa', loader: () => fetch('https://unpkg.com/@iconify-json/fa6-regular@1/icons.json').then(res => res.json()) },
                { name: 'fas', loader: () => fetch('https://unpkg.com/@iconify-json/fa6-solid@1/icons.json').then(res => res.json()) },
            ]);
            setIconsLoaded(true);
        } catch (e) {
            console.error("Failed to register icon packs", e);
            setIconsLoaded(true);
        }
    };
    registerIcons();
  }, []);

  // 2. Initialize Mermaid Config
  useEffect(() => {
    const mermaidTheme = activeStyle.diagramLook === 'handDrawn' ? 'neutral' : (theme === 'midnight' ? 'dark' : theme);
    const isHandDrawn = activeStyle.diagramLook === 'handDrawn';

    const themeVariables: any = {
        fontFamily: '"Inter", sans-serif',
        primaryColor: activeStyle.nodeColor,
        primaryBorderColor: activeStyle.lineColor,
        lineColor: activeStyle.lineColor,
        textColor: activeStyle.textColor,
        mainBkg: activeStyle.nodeColor,
        actorBkg: activeStyle.nodeColor,
        actorBorder: activeStyle.lineColor,
        actorTextColor: activeStyle.textColor,
        actorLineColor: activeStyle.lineColor,
        signalColor: activeStyle.lineColor,
        signalTextColor: activeStyle.textColor,
        labelBoxBkgColor: activeStyle.nodeColor,
        labelBoxBorderColor: activeStyle.lineColor,
    };

    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose',
      fontFamily: '"Inter", sans-serif',
      themeVariables: themeVariables,
      // @ts-ignore
      look: isHandDrawn ? 'handDrawn' : 'classic',
      flowchart: { htmlLabels: true, curve: isHandDrawn ? 'linear' : 'basis' },
      sequence: { showSequenceNumbers: false, actorMargin: 50, useMaxWidth: true }
    });
    
    // If style changes, we might want to re-render even if code didn't change
    // But setting svgContent to '' triggers the render effect below
    setSvgContent(''); 
  }, [theme, activeStyle.nodeColor, activeStyle.lineColor, activeStyle.textColor, activeStyle.diagramLook]);

  // 3. Render Diagram
  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      // PERF: Only render if visible (shouldRender), icons loaded, and code exists
      if (!code || !iconsLoaded || !shouldRender) return;
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        if (isMounted) {
            let processedSvg = svg;
            if (activeStyle.diagramLook === 'classic' && activeStyle.lineColor === '#00ff9d') {
                processedSvg = svg.replace(/<style>/, `<style>.edgePath .path { filter: drop-shadow(0 0 2px ${activeStyle.lineColor}); } `);
            }
            setSvgContent(processedSvg);
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
  }, [code, iconsLoaded, activeStyle.diagramLook, activeStyle.lineColor, shouldRender]);

  // --- Interaction Handlers (Pan/Zoom/Hover) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
    setTooltip(null);
    hasDragged.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      hasDragged.current = true;
      setPosition({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }
    const target = e.target as Element;
    const group = target.closest('.node, .actor, .messageText, .classTitle, .cluster');
    if (group) {
        setIsHoveringElement(true);
        const content = group.textContent?.trim() || '';
        if (content) {
            setTooltip({ x: e.clientX, y: e.clientY, content, type: 'Element' });
        }
    } else {
        setTooltip(null);
        setIsHoveringElement(false);
    }
  };

  // ZOOM: Wheel Support
  const handleWheel = (e: React.WheelEvent) => {
    if (showControls || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const delta = -e.deltaY * 0.001; 
        const newScale = Math.min(Math.max(0.2, scale + delta), 5);
        setScale(newScale);
    }
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => { setIsPanning(false); setTooltip(null); setIsHoveringElement(false); };
  const handleClick = (e: React.MouseEvent) => {
      if (hasDragged.current || !onElementClick) return;
      const target = e.target as Element;
      const group = target.closest('.node, .actor, .messageText');
      if (group) onElementClick(group.textContent?.trim() || '');
  };

  const resetView = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const getBackgroundStyle = () => {
      const bg = activeStyle.backgroundColor || '#131316';
      const opacity = activeStyle.backgroundOpacity ?? 1;
      const color = (activeStyle.lineColor === '#ffffff' || activeStyle.lineColor === '#e4e4e7') ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.05)';
      
      const baseStyle: React.CSSProperties = {
          backgroundColor: bg,
          opacity: opacity
      };

      if (activeStyle.backgroundPattern === 'dots') {
          return {
              ...baseStyle,
              backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
          };
      } else if (activeStyle.backgroundPattern === 'grid') {
          return {
              ...baseStyle,
              backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
          };
      } else if (activeStyle.backgroundPattern === 'crossline') {
          return {
              ...baseStyle,
              backgroundImage: `
                  linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color}),
                  linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color})
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px'
          };
      }
      return baseStyle;
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col select-none group/canvas bg-[#09090b]">
      
      <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-500 ease-in-out" style={getBackgroundStyle()}></div>

      <div 
        className={`flex-1 overflow-hidden relative z-10 ${isPanning ? 'cursor-grabbing' : isHoveringElement ? 'cursor-pointer' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel} 
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
                padding: '100px',
                filter: activeStyle.diagramLook === 'handDrawn' ? 'contrast(1.1) sepia(0.1)' : 'none'
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        
        {(!svgContent) && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 animate-pulse">
                <Box className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-mono text-xs tracking-widest uppercase opacity-50">
                    {shouldRender ? 'Rendering...' : 'Waiting to render...'}
                </p>
           </div>
        )}
      </div>

      {showControls && (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
         
         {/* Style Studio (Pop-up) */}
         {showStyleMenu && onUpdateStyle && (
             <div className="bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl mb-2 w-72 animate-slide-up ring-1 ring-black/20">
                 <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                     <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                         <Palette className="w-3.5 h-3.5" /> Style Studio
                     </span>
                     <button onClick={() => setShowStyleMenu(false)} className="text-zinc-400 hover:text-white"><Eye className="w-3.5 h-3.5" /></button>
                 </div>

                 {/* Presets */}
                 <div className="grid grid-cols-2 gap-2 mb-4">
                     {Object.keys(STYLE_PRESETS).map(preset => (
                         <button
                            key={preset}
                            onClick={() => onUpdateStyle(STYLE_PRESETS[preset])}
                            className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border ${
                                JSON.stringify(activeStyle) === JSON.stringify(STYLE_PRESETS[preset])
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                         >
                            {preset}
                         </button>
                     ))}
                 </div>

                 <div className="mb-4">
                     <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">Render Mode</label>
                     <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
                         <button 
                            onClick={() => onUpdateStyle({...activeStyle, diagramLook: 'classic'})}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${activeStyle.diagramLook === 'classic' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                         >
                            Classic
                         </button>
                         <button 
                            onClick={() => onUpdateStyle({...activeStyle, diagramLook: 'handDrawn'})}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${activeStyle.diagramLook === 'handDrawn' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                         >
                            Sketch
                         </button>
                     </div>
                 </div>

                 <div className="mb-2">
                     <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">Canvas Pattern</label>
                     <div className="flex gap-2">
                         {(['solid', 'dots', 'grid', 'crossline'] as BackgroundPattern[]).map(pat => (
                             <button
                                key={pat}
                                onClick={() => onUpdateStyle({...activeStyle, backgroundPattern: pat})}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                    activeStyle.backgroundPattern === pat 
                                    ? 'border-primary bg-primary/10 text-primary' 
                                    : 'border-white/10 bg-zinc-800 text-zinc-500 hover:border-white/30'
                                }`}
                                title={pat}
                             >
                                {pat === 'solid' && <Box className="w-3.5 h-3.5" />}
                                {pat === 'dots' && <Grid className="w-3.5 h-3.5" />}
                                {pat === 'grid' && <Layout className="w-3.5 h-3.5" />}
                                {pat === 'crossline' && <Settings2 className="w-3.5 h-3.5" />}
                             </button>
                         ))}
                     </div>
                 </div>
             </div>
         )}

         {/* Floating Control Bar */}
         <div className="flex items-center gap-1 bg-surface/90 backdrop-blur-xl border border-white/10 rounded-full px-3 py-2 shadow-2xl ring-1 ring-black/20 hover:scale-[1.01] transition-transform">
             
             {onUpdateStyle && (
                 <>
                    <button 
                        onClick={() => setShowStyleMenu(!showStyleMenu)}
                        className={`p-2 rounded-full transition-colors ${showStyleMenu ? 'bg-primary text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                        title="Open Style Studio"
                    >
                        <Palette className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-2"></div>
                 </>
             )}

             <button 
                onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                title="Zoom Out"
             >
                <Minus className="w-4 h-4" />
             </button>
             
             <div 
                className="px-2 w-12 text-center text-xs font-mono text-zinc-300 font-medium cursor-pointer hover:text-white select-none"
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

             <div className="w-px h-4 bg-white/10 mx-2"></div>
             
             <button 
                onClick={resetView}
                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                title="Reset View"
             >
                <RotateCcw className="w-3.5 h-3.5" />
             </button>
         </div>
      </div>
      )}

      {tooltip && (
        <div 
            className="fixed z-50 px-3 py-2 bg-zinc-900/90 border border-white/10 text-white rounded-lg shadow-xl backdrop-blur-md pointer-events-none animate-fade-in"
            style={{ left: tooltip.x + 15, top: tooltip.y + 15, maxWidth: '250px' }}
        >
            <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">{tooltip.type}</div>
            <div className="text-xs font-medium">{tooltip.content}</div>
        </div>
      )}
    </div>
  );
};

export default DiagramPreview;