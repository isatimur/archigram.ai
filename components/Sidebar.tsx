import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Box, Search, Pencil, ChevronLeft, ChevronRight, LayoutTemplate, FileCode } from 'lucide-react';
import { Project } from '../types.ts';
import { TEMPLATES } from '../constants.ts';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onCreateFromTemplate: (name: string, code: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
  lastSaved: Date | null;
  saveStatus: 'saved' | 'saving';
  onRenameProject: (id: string, name: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onCreateFromTemplate,
  onDeleteProject,
  onClose,
  lastSaved,
  saveStatus,
  onRenameProject,
  isCollapsed,
  toggleCollapse
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  const startEditing = (project: Project, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setEditingId(project.id);
      setEditName(project.name);
  };

  const submitRename = (id: string) => {
      if (editName.trim()) {
          onRenameProject(id, editName.trim());
      }
      setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') {
          submitRename(id);
      } else if (e.key === 'Escape') {
          setEditingId(null);
      }
  };

  // Generate a consistent color for the project icon
  const getProjectColor = (id: string) => {
    const colors = [
        'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 
        'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-rose-500'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
      return name.substring(0, 2).toUpperCase();
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-primary/20 text-primary font-bold rounded-[2px] px-0.5">{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="w-full h-full bg-surface/80 border-r border-border flex flex-col backdrop-blur-xl relative transition-all duration-300 pt-5">
      
      {/* 1. Actions & Search */}
      <div className={`flex flex-col gap-3 transition-all duration-300 ${isCollapsed ? 'p-2' : 'px-4 pb-4'}`}>
         {/* New Project Button */}
         <button 
            onClick={onCreateProject}
            className={`
                flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-all shadow-lg shadow-primary/20 group hover:scale-[1.02] active:scale-[0.98]
                ${isCollapsed ? 'w-10 h-10 rounded-xl mx-auto' : 'w-full py-2.5 px-4'}
            `}
            title="Create New Diagram"
        >
            <Plus className={`transition-transform duration-300 ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 group-hover:rotate-90'}`} />
            {!isCollapsed && <span className="text-sm font-semibold">New Diagram</span>}
        </button>

        {/* Search Bar (Expanded Only) */}
        {!isCollapsed && (
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <input 
                    type="text"
                    placeholder="Search diagrams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-hover/50 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface-hover transition-all"
                />
            </div>
        )}
      </div>

      {/* 2. Scrollable Area: Templates & Project List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border px-2">

        {/* PROJECTS SECTION */}
        {!isCollapsed && (
            <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <span>Projects</span>
                <span className="bg-surface border border-border px-1.5 rounded">{filteredProjects.length}</span>
            </div>
        )}

        <div className="space-y-1 pb-4">
            {filteredProjects.map((project) => {
                const isActive = activeProjectId === project.id;
                const isEditing = editingId === project.id;
                const colorClass = getProjectColor(project.id);
                
                return (
                    <div 
                        key={project.id}
                        onClick={() => !isEditing && onSelectProject(project.id)}
                        className={`
                            group relative flex items-center rounded-lg cursor-pointer transition-all duration-200
                            ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-2.5'}
                            ${isActive
                                ? 'bg-surface border border-border/50 shadow-sm'
                                : 'border border-transparent hover:bg-surface-hover text-text-muted hover:text-text'
                            }
                        `}
                        title={isCollapsed ? project.name : ''}
                    >
                        {/* Project Icon / Avatar */}
                        <div className={`
                            shrink-0 flex items-center justify-center font-bold text-[10px] text-white shadow-inner transition-all
                            ${isCollapsed ? 'w-8 h-8 rounded-lg text-xs' : 'w-8 h-8 rounded-md'}
                            ${colorClass}
                        `}>
                            {isCollapsed ? getInitials(project.name) : <Box className="w-4 h-4 text-white" />}
                        </div>

                        {/* Project Name (Expanded Only) */}
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0 flex-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => submitRename(project.id)}
                                        onKeyDown={(e) => handleKeyDown(e, project.id)}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-background border border-primary/50 text-text text-sm rounded px-1 py-0.5 focus:outline-none w-full"
                                    />
                                ) : (
                                    <>
                                        <span className={`text-sm font-medium truncate ${isActive ? 'text-text' : ''}`}>
                                            {highlightMatch(project.name, searchQuery)}
                                        </span>
                                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                                            {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Actions (Expanded Only) */}
                        {!isCollapsed && !isEditing && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => startEditing(project, e)}
                                    className="p-1.5 rounded-md hover:bg-surface hover:text-text text-text-muted transition-colors"
                                    title="Rename"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {projects.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            e.nativeEvent.stopImmediatePropagation();
                                            onDeleteProject(project.id, e);
                                        }}
                                        className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 text-text-muted transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Tooltip for collapsed mode */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-900 border border-border text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                {project.name}
                                {/* Small arrow pointing left */}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-zinc-900"></div>
                            </div>
                        )}
                        
                        {isActive && !isCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"></div>}
                        
                        {/* Saving Indicator */}
                        {isActive && saveStatus === 'saving' && (
                            <div className="absolute right-2 top-2">
                                <span className="flex h-1.5 w-1.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {filteredProjects.length === 0 && searchQuery && (
                <div className="px-4 py-8 text-center text-text-muted text-xs">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No diagrams found.
                </div>
            )}
        </div>

        {/* TEMPLATES SECTION (Hidden during search or collapse) */}
        {!isCollapsed && !searchQuery && (
            <div className="mt-2 mb-6 border-t border-border/40 pt-4">
                <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider opacity-80">
                    <span>Templates</span>
                </div>
                <div className="space-y-1">
                    {Object.entries(TEMPLATES).map(([name, code]) => (
                        <button
                            key={name}
                            onClick={() => onCreateFromTemplate(name, code)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:bg-surface-hover text-text-muted hover:text-text hover:border-border/50 transition-all text-left group"
                        >
                            <div className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center group-hover:bg-background transition-colors">
                                <LayoutTemplate className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-sm font-medium">{name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
      
      {/* 3. Footer / Toggle */}
      <div className={`border-t border-border bg-surface/30 flex flex-col ${isCollapsed ? 'items-center p-2 gap-4' : 'p-3 gap-2'}`}>
        
        {/* User Profile */}
        <div className={`
            flex items-center rounded-xl hover:bg-surface transition-colors cursor-pointer group
            ${isCollapsed ? 'justify-center p-0 w-10 h-10' : 'p-2 gap-3'}
        `}>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background group-hover:ring-primary/20 transition-all shrink-0">
                AG
            </div>
            {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-text truncate">Pro Architect</span>
                    <span className="text-[10px] text-text-muted truncate">
                       {lastSaved ? 'Synced just now' : 'Online'}
                    </span>
                </div>
            )}
        </div>

        {/* Collapse Toggle */}
        <button 
            onClick={toggleCollapse}
            className={`
                flex items-center justify-center rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-text
                ${isCollapsed ? 'w-8 h-8' : 'w-full py-1.5 hover:bg-surface-hover mt-1'}
            `}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;