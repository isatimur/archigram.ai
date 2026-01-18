import React, { useState } from 'react';
import { LayoutTemplate, Share2, Palette, FilePlus, Code2, Columns, Eye, Image as ImageIcon, FileCode, Check, ChevronDown } from 'lucide-react';
import { ViewMode, DiagramTheme } from '../types';
import { TEMPLATES } from '../constants';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  currentTheme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  onSelectTemplate: (code: string) => void;
  onShare: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  viewMode, 
  setViewMode, 
  onExportPng, 
  onExportSvg,
  currentTheme,
  setTheme,
  onSelectTemplate,
  onShare
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  return (
    <header className="h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      
      {/* 1. Brand Identity */}
      <div className="flex items-center gap-4">
        <div className="relative group cursor-default">
          <div className="absolute inset-0 bg-indigo-500/30 rounded-xl blur-lg group-hover:bg-indigo-500/50 transition-all duration-500 opacity-50"></div>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
            <LayoutTemplate className="w-5 h-5 text-white drop-shadow-md" />
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-0.5">
              <span className="drop-shadow-sm">ArchiGraph</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 font-extrabold drop-shadow-sm">.ai</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase opacity-80">Enterprise</p>
        </div>
      </div>

      {/* 2. Middle: View & Tools */}
      <div className="flex items-center gap-4">
        
        {/* View Switcher */}
        <div className="flex items-center bg-zinc-900/50 p-1 rounded-lg border border-white/5 shadow-inner">
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
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-zinc-800/50"></div>

        {/* Templates Dropdown */}
        <div className="relative">
            <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
            >
                <FilePlus className="w-4 h-4 text-indigo-400" />
                Templates
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            
            {showTemplates && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-56 py-1 bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden ring-1 ring-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-800/50">Start with...</div>
                    {Object.keys(TEMPLATES).map((key) => (
                        <button
                            key={key}
                            onClick={() => {
                                onSelectTemplate(TEMPLATES[key]);
                                setShowTemplates(false);
                            }}
                            className="text-left px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></span>
                            {key}
                        </button>
                    ))}
                </div>
                </>
            )}
        </div>

         {/* Theme Dropdown */}
         <div className="relative">
            <button 
                onClick={() => setShowThemes(!showThemes)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
            >
                <Palette className="w-4 h-4 text-purple-400" />
                Theme
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            
            {showThemes && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setShowThemes(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-40 py-1 bg-[#18181b] border border-zinc-800 rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden ring-1 ring-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-800/50">Visual Style</div>
                    {['dark', 'forest', 'neutral', 'base'].map((t) => (
                        <button
                            key={t}
                            onClick={() => {
                                setTheme(t as DiagramTheme);
                                setShowThemes(false);
                            }}
                            className="text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-between"
                        >
                            <span className="capitalize">{t}</span>
                            {currentTheme === t && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        </button>
                    ))}
                </div>
                </>
            )}
        </div>

      </div>

      {/* 3. Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-zinc-900/50 border border-white/5 rounded-lg p-1 shadow-sm">
            <button 
                onClick={onExportSvg}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all duration-200"
                title="Export as SVG"
            >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">SVG</span>
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1"></div>
            <button 
                onClick={onExportPng}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all duration-200"
                title="Export as PNG"
            >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">PNG</span>
            </button>
        </div>

        <button 
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg shadow-lg shadow-indigo-500/20 border border-indigo-500/20 transition-all hover:scale-105 active:scale-95 group"
        >
          <Share2 className="w-3.5 h-3.5 group-hover:animate-pulse" />
          Share Link
        </button>
      </div>
    </header>
  );
};

export default Header;