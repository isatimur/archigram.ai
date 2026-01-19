import React, { useState } from 'react';
import { LayoutTemplate, Share2, Palette, Code2, Columns, Eye, Image as ImageIcon, FileCode, Check, ChevronDown, Plus } from 'lucide-react';
import { ViewMode, DiagramTheme } from '../types.ts';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  currentTheme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  onShare: () => void;
  onNewProject: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  viewMode, 
  setViewMode, 
  onExportPng, 
  onExportSvg,
  currentTheme,
  setTheme,
  onShare,
  onNewProject
}) => {
  const [showThemes, setShowThemes] = useState(false);

  // Helper for Theme Previews
  const themeColors: Record<DiagramTheme, string> = {
      dark: '#6366f1',    // Indigo
      midnight: '#38bdf8', // Sky
      forest: '#4ade80',  // Green
      neutral: '#f43f5e',  // Rose
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm transition-colors duration-500">
      
      {/* 1. Brand Identity */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col justify-center select-none">
            <h1 className="text-lg font-bold tracking-tight text-text flex items-center gap-0.5">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary font-extrabold drop-shadow-sm">Archi</span>
              <span className="drop-shadow-sm">Gram</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary font-extrabold drop-shadow-sm">.ai</span>
            </h1>
            <p className="text-[9px] text-text-muted font-mono tracking-[0.2em] uppercase opacity-80">Workspace</p>
        </div>
      </div>

      {/* 2. Middle: View & Tools */}
      <div className="flex items-center gap-4">
        
        {/* View Switcher */}
        <div className="hidden md:flex items-center bg-surface p-1 rounded-lg border border-border shadow-inner">
          {[
            { mode: ViewMode.Code, icon: Code2, label: 'Code' },
            { mode: ViewMode.Split, icon: Columns, label: 'Split' },
            { mode: ViewMode.Preview, icon: Eye, label: 'Preview' }
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
                viewMode === mode 
                ? 'bg-background text-text shadow-sm ring-1 ring-border' 
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="hidden md:block h-6 w-px bg-border/50"></div>

         {/* Theme Dropdown */}
         <div className="relative">
            <button 
                onClick={() => setShowThemes(!showThemes)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-muted hover:text-text hover:bg-surface rounded-lg transition-colors border border-transparent hover:border-border"
            >
                <Palette className="w-4 h-4 text-accent" />
                <span className="capitalize">{currentTheme}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            
            {showThemes && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setShowThemes(false)}></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 py-1 bg-surface border border-border rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden ring-1 ring-border/20 animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-bold border-b border-border/50 bg-surface-hover/30">Theme Preset</div>
                    {(['dark', 'midnight', 'forest', 'neutral'] as DiagramTheme[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => {
                                setTheme(t);
                                setShowThemes(false);
                            }}
                            className="text-left px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-3 h-3 rounded-full border border-border shadow-sm group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: themeColors[t] }}
                                ></div>
                                <span className="capitalize">{t}</span>
                            </div>
                            {currentTheme === t && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>
                    ))}
                </div>
                </>
            )}
        </div>

      </div>

      {/* 3. Actions */}
      <div className="flex items-center gap-3">
         <button 
            onClick={onNewProject}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text border border-border hover:border-text-muted/50 rounded-lg transition-all"
        >
            <Plus className="w-3.5 h-3.5" />
            New
        </button>

        <div className="flex items-center bg-surface border border-border rounded-lg p-1 shadow-sm">
            <button 
                onClick={onExportSvg}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-all duration-200"
                title="Export as SVG"
            >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">SVG</span>
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button 
                onClick={onExportPng}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-all duration-200"
                title="Export as PNG"
            >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">PNG</span>
            </button>
        </div>

        <button 
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/20 border border-primary/20 transition-all hover:scale-105 active:scale-95 group"
        >
          <Share2 className="w-3.5 h-3.5 group-hover:animate-pulse" />
          Share
        </button>
      </div>
    </header>
  );
};

export default Header;