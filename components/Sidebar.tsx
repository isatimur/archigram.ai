import React from 'react';
import { Folder, Plus, Trash2, Clock, Box, PanelLeftClose } from 'lucide-react';
import { Project } from '../types.ts';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onClose
}) => {
  return (
    <div className="w-64 bg-background border-r border-border flex flex-col h-full shrink-0 transition-all duration-300">
      
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Folder className="w-3.5 h-3.5" />
                Projects
            </span>
            <div className="flex items-center gap-2">
                <span className="bg-surface text-text-muted px-1.5 py-0.5 rounded text-[10px] font-mono border border-border">
                    {projects.length}
                </span>
                <button 
                    onClick={onClose}
                    className="text-text-muted hover:text-text p-1 hover:bg-surface-hover rounded transition-colors"
                    title="Collapse Sidebar"
                >
                    <PanelLeftClose className="w-4 h-4" />
                </button>
            </div>
        </div>
        
        <button 
            onClick={onCreateProject}
            className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover text-text-muted hover:text-text border border-border py-2 rounded-lg text-xs font-medium transition-all group shadow-sm"
        >
            <Plus className="w-3.5 h-3.5 text-primary group-hover:text-primary-hover" />
            New Diagram
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border">
        <div className="space-y-1">
            {projects.map((project) => (
                <div 
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className={`group relative flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-all border ${
                        activeProjectId === project.id
                        ? 'bg-surface border-primary/30 shadow-sm'
                        : 'hover:bg-surface-hover border-transparent hover:border-border text-text-muted'
                    }`}
                >
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-sm font-medium text-text truncate">
                             <Box className={`w-3.5 h-3.5 ${activeProjectId === project.id ? 'text-primary' : 'text-text-muted'}`} />
                             <span className="truncate max-w-[140px]">{project.name}</span>
                         </div>
                         
                         <button
                            onClick={(e) => onDeleteProject(project.id, e)}
                            className={`p-1.5 rounded transition-all hover:bg-red-500/10 hover:text-red-500 text-text-muted z-10 ${
                                projects.length > 1 ? '' : 'hidden'
                            }`}
                            title="Delete Project"
                         >
                             <Trash2 className="w-3.5 h-3.5" />
                         </button>
                    </div>
                    
                    <div className="flex items-center gap-1 text-[10px] text-text-muted pl-5.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    
                    {/* Active Indicator */}
                    {activeProjectId === project.id && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r-full"></div>
                    )}
                </div>
            ))}
        </div>
      </div>
      
      {/* User / Settings Placeholder */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-surface border border-border opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-500 to-gray-700 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
                AG
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-text">Pro Member</span>
                <span className="text-[10px] text-text-muted">archigram.ai</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;