import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { RotateCcw, Box, Minus, Plus, Palette, Eye } from 'lucide-react';
import { DiagramTheme, DiagramStyleConfig, BackgroundPattern } from '../types.ts';

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
  Professional: {
    backgroundPattern: 'dots',
    backgroundColor: '#131316',
    backgroundOpacity: 1,
    diagramLook: 'classic',
    lineColor: '#6366f1',
    textColor: '#e4e4e7',
    nodeColor: '#1e1e24',
  },
  Blueprint: {
    backgroundPattern: 'grid',
    backgroundColor: '#1e3a8a', // Deep Blue
    backgroundOpacity: 1,
    diagramLook: 'handDrawn',
    lineColor: '#ffffff',
    textColor: '#ffffff',
    nodeColor: 'rgba(255,255,255,0.1)',
  },
  Cyberpunk: {
    backgroundPattern: 'crossline',
    backgroundColor: '#09090b',
    backgroundOpacity: 1,
    diagramLook: 'classic',
    lineColor: '#00ff9d', // Neon Green
    textColor: '#00ff9d',
    nodeColor: '#000000',
  },
  Paper: {
    backgroundPattern: 'solid',
    backgroundColor: '#f5f5f4', // Warm Grey
    backgroundOpacity: 1,
    diagramLook: 'handDrawn',
    lineColor: '#292524',
    textColor: '#292524',
    nodeColor: '#ffffff',
  },
};

// Pattern mini-preview SVGs for the style panel
const PATTERN_OPTIONS: { key: BackgroundPattern; label: string; svg: React.ReactNode }[] = [
  {
    key: 'solid',
    label: 'Solid',
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <rect x="1" y="1" width="12" height="12" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    key: 'dots',
    label: 'Dots',
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14">
        {[3, 7, 11].map((x) =>
          [3, 7, 11].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="currentColor" />
          ))
        )}
      </svg>
    ),
  },
  {
    key: 'grid',
    label: 'Grid',
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path
          d="M1 5h12M1 9h12M5 1v12M9 1v12"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.8"
        />
      </svg>
    ),
  },
  {
    key: 'crossline',
    label: 'Cross',
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        <path d="M1 7h12M7 1v12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      </svg>
    ),
  },
];

const DiagramPreview: React.FC<DiagramPreviewProps> = ({
  code,
  onError,
  theme,
  customStyle,
  onUpdateStyle,
  onElementClick,
  showControls = true,
}) => {
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
    ...customStyle,
  };

  // 0. Lazy Loading Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setShouldRender(true), 50);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 1. Initialize Icons (Robust Loading with CDN Fallback)
  useEffect(() => {
    const registerIcons = async () => {
      if (iconsLoaded) return;

      try {
        // Helper to load pack either from module (via importmap) or CDN fallback
        const loadPack = async (pkg: string, name: string, fallbackUrl?: string) => {
          try {
            const mod = await import(/* @vite-ignore */ pkg);
            return { name, icons: mod.icons || mod.default?.icons };
          } catch {
            if (fallbackUrl) {
              return { name, loader: () => fetch(fallbackUrl).then((res) => res.json()) };
            }
            return null;
          }
        };

        const loaders = [
          // Logos (General Tech)
          loadPack(
            '@iconify-json/logos',
            'logos',
            'https://esm.sh/@iconify-json/logos@1/icons.json'
          ),
          // Font Awesome
          loadPack(
            '@iconify-json/fa6-regular',
            'fa',
            'https://esm.sh/@iconify-json/fa6-regular@1/icons.json'
          ),
          loadPack(
            '@iconify-json/fa6-solid',
            'fas',
            'https://esm.sh/@iconify-json/fa6-solid@1/icons.json'
          ),
          loadPack(
            '@iconify-json/material-symbols',
            'material',
            'https://esm.sh/@iconify-json/material-symbols@1/icons.json'
          ),
        ];

        const results = await Promise.all(loaders);
        const packs = results.flat().filter((p) => p !== null);

        await mermaid.registerIconPacks(packs);
        setIconsLoaded(true);
      } catch (e) {
        console.error('Failed to register icon packs', e);
        setIconsLoaded(true); // Proceed anyway to avoid blocking render
      }
    };
    registerIcons();
  }, [iconsLoaded]);

  // 2. Initialize Mermaid Config
  useEffect(() => {
    if (!code) return;

    // Robust Diagram Type Detection
    const hasFrontMatter = /^-{3}[\s\S]*?-{3}/.test(code);
    const codeBody = hasFrontMatter ? code.replace(/^-{3}[\s\S]*?-{3}/, '') : code;

    const isGitGraph = /^\s*gitGraph/m.test(codeBody) || codeBody.includes('gitGraph');
    const isMindmap = /^\s*mindmap/m.test(codeBody) || codeBody.includes('mindmap');
    const isArchitecture =
      /^\s*architecture-beta/m.test(codeBody) || codeBody.includes('architecture-beta');

    // Determine unstable condition: HandDrawn look + unsupported diagram type
    const unsafeForHandDrawn = isGitGraph || isMindmap || isArchitecture;

    const MERMAID_THEME_MAP: Record<string, 'dark' | 'forest' | 'neutral' | 'default' | 'base'> = {
      dark: 'dark',
      midnight: 'dark',
      forest: 'forest',
      neutral: 'default',
      ember: 'dark',
      dusk: 'dark',
    };
    const mermaidTheme =
      activeStyle.diagramLook === 'handDrawn'
        ? ('neutral' as const)
        : (MERMAID_THEME_MAP[theme] ?? 'dark');
    const isHandDrawn = activeStyle.diagramLook === 'handDrawn';

    const themeVariables: Record<string, string | undefined> = {
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
      // GitGraph Specifics
      git0: activeStyle.lineColor || '#6366f1',
      git1: activeStyle.textColor || '#e4e4e7',
      git2: activeStyle.nodeColor || '#1e1e24',
      gitBranchLabel0: activeStyle.textColor,
      gitBranchLabel1: activeStyle.textColor,
    };

    const look: 'classic' | 'handDrawn' = unsafeForHandDrawn
      ? 'classic'
      : isHandDrawn
        ? 'handDrawn'
        : 'classic';
    const curve = isHandDrawn && !unsafeForHandDrawn ? ('linear' as const) : ('basis' as const);

    const config = {
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose' as const,
      fontFamily: '"Inter", sans-serif',
      themeVariables: themeVariables,
      sequence: { showSequenceNumbers: false, actorMargin: 50, useMaxWidth: true },
      look,
      flowchart: { htmlLabels: true, curve },
    };

    try {
      mermaid.initialize(config);
      setSvgContent('');
    } catch (e) {
      console.warn('Mermaid init failed', e);
    }
  }, [
    theme,
    activeStyle.nodeColor,
    activeStyle.lineColor,
    activeStyle.textColor,
    activeStyle.diagramLook,
    code,
  ]);

  // 3. Render Diagram
  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!code || !iconsLoaded || !shouldRender) return;

      try {
        if (!(await mermaid.parse(code))) {
          throw new Error('Invalid Syntax');
        }

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);

        if (isMounted) {
          let processedSvg = svg;
          if (activeStyle.diagramLook === 'classic' && activeStyle.lineColor === '#00ff9d') {
            processedSvg = svg.replace(
              /<style>/,
              `<style>.edgePath .path { filter: drop-shadow(0 0 2px ${activeStyle.lineColor}); } `
            );
          }
          setSvgContent(processedSvg);
          onError(null);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Syntax Error';
          if (
            msg.includes("reading 'decision'") ||
            msg.includes('undefined') ||
            msg.includes('Cannot read properties')
          ) {
            console.warn('Mermaid Render Error:', msg);
            onError('Rendering Engine Issue: Try simplifying the diagram or checking syntax.');
          } else {
            const mermaidErr = err as Record<string, unknown>;
            const textMatch = typeof mermaidErr?.str === 'string' ? mermaidErr.str : msg;
            onError(textMatch);
          }
        }
      }
    };

    const renderTimer = setTimeout(renderDiagram, 100);
    return () => {
      isMounted = false;
      clearTimeout(renderTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    code,
    iconsLoaded,
    activeStyle.diagramLook,
    activeStyle.lineColor,
    activeStyle.nodeColor,
    activeStyle.textColor,
    theme,
    shouldRender,
  ]);

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
  const handleMouseLeave = () => {
    setIsPanning(false);
    setTooltip(null);
    setIsHoveringElement(false);
  };
  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current || !onElementClick) return;
    const target = e.target as Element;
    const group = target.closest('.node, .actor, .messageText');
    if (group) onElementClick(group.textContent?.trim() || '');
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const getBackgroundStyle = () => {
    const bg = activeStyle.backgroundColor || '#131316';
    const opacity = activeStyle.backgroundOpacity ?? 1;
    const color =
      activeStyle.lineColor === '#ffffff' || activeStyle.lineColor === '#e4e4e7'
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(99,102,241,0.05)';

    const baseStyle: React.CSSProperties = {
      backgroundColor: bg,
      opacity: opacity,
    };

    if (activeStyle.backgroundPattern === 'dots') {
      return {
        ...baseStyle,
        backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      };
    } else if (activeStyle.backgroundPattern === 'grid') {
      return {
        ...baseStyle,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      };
    } else if (activeStyle.backgroundPattern === 'crossline') {
      return {
        ...baseStyle,
        backgroundImage: `
                  linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color}),
                  linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color})
              `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
      };
    }
    return baseStyle;
  };

  const updateStyle = (
    key: keyof DiagramStyleConfig,
    value: DiagramStyleConfig[keyof DiagramStyleConfig]
  ) => {
    if (onUpdateStyle) {
      onUpdateStyle({ ...activeStyle, [key]: value });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col select-none group/canvas bg-[#09090b]">
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-500 ease-in-out"
        style={getBackgroundStyle()}
      >
        {/* Subtle Ambient Spotlight for 'wow' effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      </div>
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
            filter: activeStyle.diagramLook === 'handDrawn' ? 'contrast(1.1) sepia(0.1)' : 'none',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        {!svgContent && (
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
          {showStyleMenu && onUpdateStyle && (
            <div
              className="backdrop-blur-xl rounded-2xl mb-2 w-72 animate-slide-up overflow-hidden"
              style={{
                background: 'rgba(8,8,11,0.96)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.85)',
              }}
            >
              {/* Cyan accent top rule */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

              <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/70 flex items-center gap-1.5">
                    <Palette className="w-3 h-3" /> Style Studio
                  </span>
                  <button
                    onClick={() => setShowStyleMenu(false)}
                    className="text-zinc-700 hover:text-zinc-400 transition-colors"
                    title="Hide panel"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-0.5">
                  {/* Presets */}
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-2 block">
                      Presets
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.entries(STYLE_PRESETS) as [string, DiagramStyleConfig][]).map(
                        ([preset, config]) => {
                          const isActive = JSON.stringify(activeStyle) === JSON.stringify(config);
                          return (
                            <button
                              key={preset}
                              onClick={() => onUpdateStyle(config)}
                              className={`relative px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                                isActive
                                  ? 'border-cyan-400/30 text-white'
                                  : 'border-white/5 text-zinc-500 hover:border-white/12 hover:text-zinc-300'
                              }`}
                              style={
                                isActive
                                  ? {
                                      background: 'rgba(34,211,238,0.06)',
                                      boxShadow: '0 0 14px rgba(34,211,238,0.1)',
                                    }
                                  : { background: 'rgba(255,255,255,0.02)' }
                              }
                            >
                              {/* Mini palette dots */}
                              <div className="flex gap-0.5 mb-1.5">
                                <span
                                  className="w-2 h-2 rounded-full border border-white/10"
                                  style={{ backgroundColor: config.nodeColor ?? '#000' }}
                                />
                                <span
                                  className="w-2 h-2 rounded-full border border-white/10"
                                  style={{ backgroundColor: config.lineColor ?? '#000' }}
                                />
                                <span
                                  className="w-2 h-2 rounded-full border border-white/10"
                                  style={{ backgroundColor: config.textColor ?? '#fff' }}
                                />
                              </div>
                              <span>{preset}</span>
                              {isActive && (
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Custom Colors */}
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-2 block">
                      Colors
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          {
                            key: 'nodeColor' as const,
                            label: 'Node',
                            value: activeStyle.nodeColor ?? '#000000',
                          },
                          {
                            key: 'lineColor' as const,
                            label: 'Line',
                            value: activeStyle.lineColor ?? '#000000',
                          },
                          {
                            key: 'textColor' as const,
                            label: 'Text',
                            value: activeStyle.textColor ?? '#ffffff',
                          },
                          {
                            key: 'backgroundColor' as const,
                            label: 'Canvas',
                            value: activeStyle.backgroundColor ?? '#000000',
                          },
                        ] as { key: keyof DiagramStyleConfig; label: string; value: string }[]
                      ).map(({ key, label, value }) => (
                        <label
                          key={key}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-white/5 cursor-pointer hover:border-white/10 transition-colors group"
                          style={{ background: 'rgba(255,255,255,0.02)' }}
                        >
                          <span className="font-mono text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                            {label}
                          </span>
                          <div className="relative flex items-center">
                            <div
                              className="w-5 h-5 rounded border border-white/15 shadow-inner"
                              style={{ backgroundColor: value }}
                            />
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => updateStyle(key, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Render Mode */}
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 mb-2 block">
                      Render
                    </label>
                    <div
                      className="flex rounded-lg p-0.5 border border-white/5"
                      style={{ background: 'rgba(0,0,0,0.4)' }}
                    >
                      {[
                        { value: 'classic', label: 'Classic' },
                        { value: 'handDrawn', label: 'Sketch' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateStyle('diagramLook', value)}
                          className={`flex-1 py-1.5 rounded-md font-mono text-[10px] font-medium transition-all ${
                            activeStyle.diagramLook === value
                              ? 'text-white border border-white/10 shadow-sm'
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                          style={
                            activeStyle.diagramLook === value
                              ? { background: 'rgba(255,255,255,0.07)' }
                              : {}
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pattern */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-600 block">
                        Pattern
                      </label>
                      <span className="font-mono text-[9px] text-zinc-700">
                        {Math.round((activeStyle.backgroundOpacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <div className="flex gap-1.5 mb-2.5">
                      {PATTERN_OPTIONS.map(({ key, label, svg }) => (
                        <button
                          key={key}
                          onClick={() => updateStyle('backgroundPattern', key)}
                          className={`flex-1 h-8 rounded-lg border flex items-center justify-center transition-all ${
                            activeStyle.backgroundPattern === key
                              ? 'border-cyan-400/35 text-cyan-400'
                              : 'border-white/5 text-zinc-600 hover:border-white/12 hover:text-zinc-400'
                          }`}
                          style={
                            activeStyle.backgroundPattern === key
                              ? { background: 'rgba(34,211,238,0.06)' }
                              : { background: 'rgba(255,255,255,0.02)' }
                          }
                          title={label}
                        >
                          {svg}
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={activeStyle.backgroundOpacity ?? 1}
                      onChange={(e) => updateStyle('backgroundOpacity', parseFloat(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-400"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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
              onClick={() => setScale((s) => Math.max(s - 0.1, 0.2))}
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
              onClick={() => setScale((s) => Math.min(s + 0.1, 5))}
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
          <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
            {tooltip.type}
          </div>
          <div className="text-xs font-medium">{tooltip.content}</div>
        </div>
      )}
    </div>
  );
};

export default DiagramPreview;
