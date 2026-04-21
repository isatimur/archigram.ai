'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Box,
  Search,
  Pencil,
  LayoutTemplate,
  Zap,
  Globe,
  Check,
  ScanLine,
  FolderOpen,
} from 'lucide-react';
import { TEMPLATES, ML_TEMPLATES, C4_TEMPLATES } from '../constants.ts';
import { useUI } from '@/lib/contexts/UIContext';
import { useEditor } from '@/lib/contexts/EditorContext';

type LeftPanelProps = {
  onCreateProject: () => void;
  onCreateFromTemplate: (name: string, code: string) => void;
  onScanImage: () => void;
  onOpenGallery: () => void;
};

const TABS = [
  { id: 'projects' as const, icon: FolderOpen, label: 'Projects' },
  { id: 'templates' as const, icon: LayoutTemplate, label: 'Templates' },
  { id: 'community' as const, icon: Globe, label: 'Community' },
] as const;

const LeftPanel: React.FC<LeftPanelProps> = ({
  onCreateProject,
  onCreateFromTemplate,
  onScanImage,
  onOpenGallery,
}) => {
  const { activePanel, setActivePanel } = useUI();
  const {
    projects,
    activeProjectId,
    handleSelectProject,
    handleRenameProject,
    setPendingDeleteId,
    lastSaved,
    saveStatus,
  } = useEditor();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  const startEditing = (project: { id: string; name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(project.id);
    setEditName(project.name);
  };

  const submitRename = (id: string) => {
    if (editName.trim()) {
      handleRenameProject(id, editName.trim());
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

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-primary/20 text-primary font-bold rounded-[2px] px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleTabClick = (tabId: 'projects' | 'templates' | 'community') => {
    if (activePanel === tabId) {
      setActivePanel(null);
    } else {
      setActivePanel(tabId);
    }
  };

  return (
    <div className="w-60 h-full flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Tab strip */}
      <div className="flex border-b border-border shrink-0" role="tablist" aria-label="Left panel">
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = activePanel === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`leftpanel-${id}`}
              onClick={() => handleTabClick(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-muted hover:text-text hover:bg-surface-hover'
              }`}
              title={label}
              aria-label={label}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div
        id={`leftpanel-${activePanel ?? 'none'}`}
        role="tabpanel"
        className="flex-1 flex flex-col overflow-hidden"
      >
        {activePanel === 'projects' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Actions */}
            <div className="flex flex-col gap-2 px-3 py-3 shrink-0">
              <button
                onClick={onCreateProject}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors group w-full py-2 px-3"
                title="Create New Diagram"
                aria-label="Create New Diagram"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-sm font-semibold whitespace-nowrap">New Diagram</span>
              </button>

              <button
                onClick={onScanImage}
                className="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border text-text rounded-lg transition-all group w-full py-2 px-3"
                title="Scan Image to Diagram"
                aria-label="Scan Image to Diagram"
              >
                <ScanLine className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium whitespace-nowrap">Scan Image</span>
              </button>

              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search diagrams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-hover/50 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-surface-hover transition-all"
                  aria-label="Search Diagrams"
                />
              </div>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border px-2">
              {!searchQuery && (
                <div className="px-2 mb-2 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim">
                    Projects
                  </span>
                  <span className="bg-surface border border-border px-1.5 rounded text-[9px] text-text-muted">
                    {filteredProjects.length}
                  </span>
                </div>
              )}

              <div className="space-y-1 pb-4">
                {filteredProjects.map((project) => {
                  const isActive = activeProjectId === project.id;
                  const isEditing = editingId === project.id;

                  return (
                    <div
                      key={project.id}
                      onClick={() => !isEditing && handleSelectProject(project.id)}
                      className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-surface border border-border/50 shadow-sm'
                          : 'border border-transparent hover:bg-surface-hover text-text-muted hover:text-text'
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (!isEditing) handleSelectProject(project.id);
                        }
                      }}
                    >
                      {/* Project icon */}
                      <div className="w-7 h-7 rounded border border-border bg-surface-elevated flex items-center justify-center shrink-0">
                        <Box className="w-3.5 h-3.5 text-text-dim" />
                      </div>

                      {/* Project name */}
                      <div className="flex flex-col min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => submitRename(project.id)}
                              onKeyDown={(e) => handleKeyDown(e, project.id)}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              className="bg-background border border-primary/50 text-text text-sm rounded px-1.5 py-0.5 focus:outline-none w-full min-w-0"
                              aria-label="Rename Project"
                            />
                          </div>
                        ) : (
                          <>
                            <span
                              className={`text-sm font-medium truncate ${isActive ? 'text-text' : ''}`}
                            >
                              {highlightMatch(project.name, searchQuery)}
                            </span>
                            <span className="text-[10px] text-text-muted flex items-center gap-1 truncate">
                              {new Date(project.updatedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => startEditing(project, e)}
                            className="p-1.5 rounded-md hover:bg-surface hover:text-text text-text-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                            title="Rename"
                            aria-label="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {projects.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPendingDeleteId(project.id);
                              }}
                              className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 text-text-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/50"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Confirm rename button */}
                      {isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            submitRename(project.id);
                          }}
                          className="p-1.5 rounded-md bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500/50"
                          aria-label="Confirm Rename"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
                      )}

                      {/* Saving indicator */}
                      {isActive && saveStatus === 'saving' && (
                        <div className="absolute right-2 top-2">
                          <span className="flex h-1.5 w-1.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {projects.length === 0 && !searchQuery && (
                  <div className="px-4 py-10 text-center">
                    <Box className="w-8 h-8 mx-auto mb-3 text-text-dim opacity-40" />
                    <p className="text-xs text-text-muted mb-3">No diagrams yet.</p>
                    <button
                      onClick={onCreateProject}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create first diagram
                    </button>
                  </div>
                )}

                {filteredProjects.length === 0 && searchQuery && (
                  <div className="px-4 py-8 text-center text-text-muted text-xs">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No diagrams found.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-surface/30 p-3 shrink-0">
              <div className="flex items-center gap-2 p-2 rounded-md hover:bg-surface transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background group-hover:ring-primary/20 transition-all shrink-0">
                  AI
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-text truncate">ArchiGram User</span>
                  <span className="text-[10px] text-text-muted truncate">
                    {lastSaved ? 'Synced just now' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'templates' && (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border px-2 py-3">
            {/* ML Pipelines */}
            <div className="mb-4">
              <div className="px-2 mb-2 flex items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-accent" />
                  ML Pipelines (Wedge)
                </span>
              </div>
              <div className="space-y-1">
                {Object.entries(ML_TEMPLATES).map(([name, code]) => (
                  <button
                    key={name}
                    onClick={() => onCreateFromTemplate(name, code)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:bg-surface-hover text-text-muted hover:text-text hover:border-border/50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center group-hover:bg-background transition-colors shrink-0">
                      <Zap className="w-4 h-4 text-accent/70 group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-sm font-medium truncate">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* C4 Model */}
            <div className="mb-4 border-t border-border/40 pt-4">
              <div className="px-2 mb-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim flex items-center gap-1.5">
                  <LayoutTemplate className="w-3 h-3 text-blue-400" />
                  C4 Model
                </span>
              </div>
              <div className="space-y-1">
                {Object.entries(C4_TEMPLATES).map(([name, code]) => (
                  <button
                    key={name}
                    onClick={() => onCreateFromTemplate(name, code)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:bg-surface-hover text-text-muted hover:text-text hover:border-border/50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center group-hover:bg-background transition-colors shrink-0">
                      <LayoutTemplate className="w-4 h-4 text-blue-400/70 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <span className="text-sm font-medium truncate">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* General Templates */}
            <div className="border-t border-border/40 pt-4 mb-4">
              <div className="px-2 mb-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim">
                  Templates
                </span>
              </div>
              <div className="space-y-1">
                {Object.entries(TEMPLATES).map(([name, code]) => (
                  <button
                    key={name}
                    onClick={() => onCreateFromTemplate(name, code)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:bg-surface-hover text-text-muted hover:text-text hover:border-border/50 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center group-hover:bg-background transition-colors shrink-0">
                      <LayoutTemplate className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-sm font-medium truncate">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePanel === 'community' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-8">
            <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
              <Globe className="w-6 h-6 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-text mb-1">Community Gallery</p>
              <p className="text-xs text-text-muted">
                Explore diagrams shared by the community. Fork and customize to your needs.
              </p>
            </div>
            <button
              onClick={onOpenGallery}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
            >
              <Globe className="w-4 h-4" />
              Explore &amp; Fork
            </button>
          </div>
        )}

        {activePanel === null && <div className="flex-1" />}
      </div>
    </div>
  );
};

export default LeftPanel;
