
import React, { useState, useEffect } from 'react';
import { Share2, Palette, Code2, Columns, Eye, Image as ImageIcon, FileCode, Check, ChevronDown, Plus, Pencil, UploadCloud, Rocket, Sun, Moon, Save, Grid, ShieldCheck, Binary } from 'lucide-react';
import { ViewMode, DiagramTheme, Project, DiagramStyleConfig, AppView } from '../types.ts';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  currentTheme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;
  onShare: () => void;
  onNewProject: () => void;
  activeProject?: Project;
  onRenameProject: (id: string, name: string) => void;
  customStyle?: DiagramStyleConfig;
  onUpdateStyle: (style: DiagramStyleConfig) => void;
  onPublish: () => void;
  onNavigate: (view: AppView) => void;
  onSaveVersion: (label: string) => void;
  onAudit: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  viewMode, 
  setViewMode, 
  onExportPng, 
  onExportSvg,
  currentTheme,
  setTheme,
  onShare,
  onNewProject,
  activeProject,
  onRenameProject,
  onPublish,
  onNavigate,
  onSaveVersion,
  onAudit
}) => {
  const [showThemes, setShowThemes] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Sync title when active project changes
  useEffect(() => {
    if (activeProject) {
        setEditedTitle(activeProject.name);
    }
  }, [activeProject?.id, activeProject?.name]);

  const handleTitleSubmit = () => {
      if (activeProject && editedTitle.trim()) {
          onRenameProject(activeProject.id, editedTitle.trim());
      } else if (activeProject) {
          setEditedTitle(activeProject.name); // Revert if empty
      }
      setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleTitleSubmit();
      } else if (e.key === 'Escape') {
          if (activeProject) setEditedTitle(activeProject.name);
          setIsEditingTitle(false);
      }
  };

  // Helper for Theme Previews
  const themeColors: Record<DiagramTheme, string> = {
      dark: '#6366f1',    // Indigo
      midnight: '#38bdf8', // Sky
      forest: '#4ade80',  // Green
      neutral: '#f43f5e',  // Rose
  };

  const isDarkMode = currentTheme !== 'neutral';

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 shadow-sm transition-colors duration-500">
      
      {/* 1. Brand Identity & Project Title */}
      <div className="flex items-center gap-3 md:gap-4 max-w-[40%] md:max-w-none">
        <div className="flex flex-col justify-center select-none shrink-0">
            <h1 
                onClick={() => onNavigate('landing')}
                className="text-lg font-bold tracking-tight text-text flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Rocket className="w-3 h-3 text-white" />
              </div>
              <span className="hidden lg:inline"><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 font-extrabold drop-shadow-sm">Archi</span><span className="text-text font-bold">Gram</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 font-extrabold drop-shadow-sm">.ai</span></span>
            </h1>
        </div>
        
        <div className="h-6 w-px bg-border/50 hidden md:block"></div>

        {/* Project Title (Editable) */}
        <div className="flex items-center relative group min-w-0 flex-1">
            {isEditingTitle ? (
                <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="bg-surface border border-primary/50 text-text text-sm font-medium px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 w-full min-w-[120px]"
                />
            ) : (
                <div 
                    onClick={() => setIsEditingTitle(true)}
                    className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover rounded-md px-2 py-1 transition-colors text-sm font-medium text-text group truncate"
                    title="Click to rename"
                >
                    <span className="truncate">{activeProject?.name || 'Untitled Diagram'}</span>
                    <Pencil className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}
        </div>
      </div>

      {/* 2. Middle: View & Tools */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Tools Dropdown */}
        <div className="relative">
            <button 
                onClick={() => setShowTools(!showTools)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors border border-transparent hover:border-border"
            >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Tools</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            
            {showTools && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTools(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-56 py-1 bg-surface border border-border rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => { onNavigate('app'); setShowTools(false); }} className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-primary" /> Mermaid Studio
                    </button>
                    <button onClick={() => { onNavigate('plantuml'); setShowTools(false); }} className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-2">
                        <Binary className="w-4 h-4 text-emerald-500" />
                        PlantUML Studio
                    </button>
                    <div className="h-px bg-border/50 my-1"></div>
                    <button onClick={() => { onAudit(); setShowTools(false); }} className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-400" />
                        Run Audit
                    </button>
                </div>
                </>
            )}
        </div>

        <div className="hidden md:block h-6 w-px bg-border/50"></div>

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

         <div className="flex items-center gap-2">
             {/* Dark Mode Toggle */}
             <button
                onClick={() => setTheme(isDarkMode ? 'neutral' : 'dark')}
                className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>

             {/* Theme Dropdown */}
             <div className="relative hidden sm:block">
                <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-border">
                    <button 
                        onClick={() => setShowThemes(!showThemes)}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-colors"
                        title="Change Theme"
                    >
                        <Palette className="w-3.5 h-3.5" />
                        <span className="capitalize hidden lg:inline">{currentTheme}</span>
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                </div>
                
                {showThemes && (
                    <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowThemes(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-44 py-1 bg-surface border border-border rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden ring-1 ring-border/20 animate-in fade-in slide-in-from-top-2 duration-200">
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

      </div>

      {/* 3. Actions */}
      <div className="flex items-center gap-2 md:gap-3">
         
         {/* Audit Button (Visible on MD+) */}
         <button 
            onClick={onAudit}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-orange-400 hover:text-orange-300 border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 rounded-lg transition-all"
            title="Perform AI Security & Architecture Audit"
         >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Audit</span>
         </button>

         {/* Save Version Button */}
         <button 
            onClick={() => onSaveVersion("Manual Save")}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg transition-all"
            title="Create a Checkpoint"
         >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Save</span>
         </button>

         {/* Publish Button */}
         <button 
            onClick={onPublish}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text border border-border hover:border-text-muted/50 rounded-lg transition-all"
            title="Publish to Community Gallery"
         >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Publish</span>
        </button>

         <button 
            onClick={onNewProject}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text border border-border hover:border-text-muted/50 rounded-lg transition-all"
        >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">New</span>
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
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
