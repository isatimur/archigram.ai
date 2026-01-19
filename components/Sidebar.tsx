import React from 'react';
import { Folder, Plus, Trash2, Clock, Box, PanelLeftClose, Save, LayoutGrid, Users, Star, Search } from 'lucide-react';
import { Project } from '../types.ts';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving';
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onClose,
  lastSaved,
  saveStatus
}) => {
  return (
    <div className="w-72 bg-background border-r border-border flex flex-col h-full shrink-0 transition-all duration-300">
      
      {/* 1. Header & Workspace Selector */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-text font-bold text-sm tracking-tight">
                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
                    <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>Workspace</span>
            </div>
            <button 
                onClick={onClose}
                className="text-text-muted hover:text-text p-1.5 hover:bg-surface-hover rounded-md transition-colors"
                title="Collapse Sidebar"
            >
                <PanelLeftClose className="w-4 h-4" />
            </button>
        </div>

        <button 
            onClick={onCreateProject}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] group"
        >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            New Diagram
        </button>
      </div>

      {/* 2. Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-border">
        
        {/* Quick Links (Visual only for now) */}
        <div className="space-y-1 mb-8">
            <div className="px-3 py-2 text-text-muted hover:text-text hover:bg-surface-hover rounded-lg cursor-pointer flex items-center gap-3 transition-colors text-sm font-medium">
                <Folder className="w-4 h-4" />
                All Projects
            </div>
            <div className="px-3 py-2 text-text-muted hover:text-text hover:bg-surface-hover rounded-lg cursor-pointer flex items-center gap-3 transition-colors text-sm font-medium">
                <Star className="w-4 h-4" />
                Favorites
            </div>
            <div className="px-3 py-2 text-text-muted hover:text-text hover:bg-surface-hover rounded-lg cursor-pointer flex items-center gap-3 transition-colors text-sm font-medium">
                <Users className="w-4 h-4" />
                Shared with me
            </div>
        </div>

        {/* Project List */}
        <div className="mb-2 px-3 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <span>Recent Diagrams</span>
            <span className="bg-surface-hover px-1.5 rounded border border-border">{projects.length}</span>
        </div>

        <div className="space-y-1">
            {projects.map((project) => {
                const isActive = activeProjectId === project.id;
                
                return (
                    <div 
                        key={project.id}
                        onClick={() => onSelectProject(project.id)}
                        className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all duration-200
                            ${isActive
                                ? 'bg-surface border-border shadow-sm'
                                : 'border-transparent hover:bg-surface-hover hover:border-transparent text-text-muted hover:text-text'
                            }
                        `}
                    >
                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-surface border border-border text-text-muted'}`}>
                            <Box className="w-4 h-4" />
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                            <span className={`text-sm font-medium truncate ${isActive ? 'text-text' : ''}`}>
                                {project.name}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted flex items-center gap-1">
                                    {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                {isActive && saveStatus === 'saving' && (
                                     <span className="flex h-1.5 w-1.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Delete Action */}
                        {projects.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    onDeleteProject(project.id, e);
                                }}
                                className={`
                                    p-1.5 rounded-md transition-all duration-200 opacity-0 group-hover:opacity-100
                                    hover:bg-red-500/10 hover:text-red-500 text-text-muted
                                `}
                                title="Delete Project"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                        
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"></div>}
                    </div>
                );
            })}
        </div>
      </div>
      
      {/* 3. Footer / User Profile */}
      <div className="p-4 border-t border-border bg-surface/30">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface transition-colors cursor-pointer group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-background group-hover:ring-primary/20 transition-all">
                AG
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-text truncate">Pro Architect</span>
                <span className="text-[10px] text-text-muted truncate flex items-center gap-1">
                   {lastSaved ? 'Synced just now' : 'Online'}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;