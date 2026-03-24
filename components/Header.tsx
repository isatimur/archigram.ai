import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Share2,
  Code2,
  Columns,
  Eye,
  Image as ImageIcon,
  FileCode,
  Check,
  ChevronDown,
  Plus,
  Pencil,
  UploadCloud,
  Sun,
  Moon,
  Save,
  ShieldCheck,
  Twitter,
  Linkedin,
  Link2,
  Copy,
  Code,
  X,
  User,
  LogOut,
  Mail,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { ViewMode, DiagramTheme, Project, AppView, User as UserType, EmbedMode } from '../types.ts';

const ShareEmailModal = lazy(() => import('./ShareEmailModal.tsx'));

type HeaderProps = {
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
  onPublish: () => void;
  onNavigate: (view: AppView) => void;
  onSaveVersion: (label: string) => void;
  onAudit: () => void;
  user?: UserType | null;
  onOpenAuth?: (mode: 'signin' | 'signup') => void;
};

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
  onAudit,
  user,
  onOpenAuth,
}) => {
  const [showThemes, setShowThemes] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showShareEmailModal, setShowShareEmailModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [embedMode, setEmbedMode] = useState<EmbedMode>('toolbar');
  const [embedHeight, setEmbedHeight] = useState<string>('500');
  const [embedWidth, setEmbedWidth] = useState<string>('100%');

  const base =
    typeof window !== 'undefined'
      ? window.location.href.split('#')[0].replace(/\/$/, '')
      : 'https://archigram-ai.vercel.app';
  const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
  const shareUrl = hash
    ? `${base}?title=${encodeURIComponent(activeProject?.name || 'Architecture Diagram')}#${hash}`
    : base;
  const shareText = `I just built a "${activeProject?.name || 'Architecture Diagram'}" with @ArchiGram_ai — check it out:`;
  const embedSrc = hash
    ? `${base}?embed=true&mode=${embedMode}#${hash}`
    : `${base}?embed=true&mode=${embedMode}`;
  const embedCode = `<iframe\n  src="${embedSrc}"\n  width="${embedWidth}"\n  height="${embedHeight}"\n  frameborder="0"\n  style="border-radius: 8px; border: 1px solid #333;"\n  title="${activeProject?.name || 'Architecture Diagram'} — ArchiGram.ai"\n></iframe>`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    setShowShareMenu(false);
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    setShowShareMenu(false);
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      toast.success('Embed code copied to clipboard');
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy embed code:', err);
      toast.error('Failed to copy embed code');
    }
  };

  const handleShareEmail = () => {
    setShowShareEmailModal(true);
    setShowShareMenu(false);
  };

  // Sync title when active project changes
  useEffect(() => {
    if (activeProject) {
      setEditedTitle(activeProject.name);
    }
  }, [activeProject]);

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

  // Theme catalog for the visual picker
  const THEME_CATALOG: Record<
    DiagramTheme,
    { name: string; vibe: string; bg: string; primary: string; accent: string }
  > = {
    dark: {
      name: 'Obsidian',
      vibe: 'Electric void',
      bg: '#09090b',
      primary: '#818cf8',
      accent: '#c484f9',
    },
    midnight: {
      name: 'Abyss',
      vibe: 'Deep ocean',
      bg: '#030712',
      primary: '#22d3ee',
      accent: '#f472b6',
    },
    forest: {
      name: 'Phosphor',
      vibe: 'Terminal green',
      bg: '#040a04',
      primary: '#4ade80',
      accent: '#fde047',
    },
    neutral: {
      name: 'Arctic',
      vibe: 'Clean & bright',
      bg: '#ffffff',
      primary: '#2563eb',
      accent: '#f87171',
    },
    ember: {
      name: 'Ember',
      vibe: 'Warm fire glow',
      bg: '#0c0806',
      primary: '#fb923c',
      accent: '#fcd34d',
    },
    dusk: {
      name: 'Dusk',
      vibe: 'Twilight violet',
      bg: '#080614',
      primary: '#c084fc',
      accent: '#fb7185',
    },
  };

  const isDarkMode = currentTheme !== 'neutral';

  return (
    <>
      <header className="h-11 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 shadow-sm transition-colors duration-500">
        {/* 1. Brand Identity & Project Title */}
        <div className="flex items-center gap-3 md:gap-4 max-w-[40%] md:max-w-none">
          <div className="flex flex-col justify-center select-none shrink-0">
            <h1
              onClick={() => onNavigate('landing')}
              className="text-lg font-bold tracking-tight text-text flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {/* Blueprint Intelligence mark — nested diamond */}
              <div
                className="w-6 h-6 border border-cyan-400/60 flex items-center justify-center shrink-0"
                style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
              >
                <div
                  className="w-2.5 h-2.5 bg-cyan-400"
                  style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                />
              </div>
              <span className="hidden lg:inline font-display tracking-tight text-[15px]">
                <span className="text-cyan-400 font-bold">Archi</span>
                <span className="text-text font-semibold">Gram</span>
                <span className="text-cyan-400/70 font-bold">.ai</span>
              </span>
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
                maxLength={100}
                aria-label="Project title"
                className="bg-surface border border-primary/50 text-text text-sm font-medium px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 w-full min-w-[120px]"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsEditingTitle(true);
                  }
                }}
                role="button"
                tabIndex={0}
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
          {/* View Switcher */}
          <div className="hidden md:flex items-center bg-surface p-1 rounded-lg border border-border shadow-inner">
            {[
              { mode: ViewMode.Code, icon: Code2, label: 'Code', shortcut: '⌘1' },
              { mode: ViewMode.Split, icon: Columns, label: 'Split', shortcut: '⌘2' },
              { mode: ViewMode.Preview, icon: Eye, label: 'Preview', shortcut: '⌘3' },
            ].map(({ mode, icon: Icon, label, shortcut }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1.5 rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                  viewMode === mode
                    ? 'bg-background text-text shadow-sm ring-1 ring-border'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                }`}
                title={`${label} (${shortcut})`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="hidden md:block h-6 w-px bg-border/50"></div>

          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(isDarkMode ? 'neutral' : 'dark')}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Theme Picker */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowThemes(!showThemes)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-lg border border-border transition-colors"
                title="Change Theme"
              >
                <span
                  className="w-3 h-3 rounded-full border border-white/20 shadow-sm shrink-0"
                  style={{ backgroundColor: THEME_CATALOG[currentTheme].primary }}
                />
                <span className="hidden lg:inline">{THEME_CATALOG[currentTheme].name}</span>
                <ChevronDown className="w-3 h-3 opacity-40" />
              </button>

              {showThemes && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowThemes(false)} />
                  <div className="absolute top-full left-0 mt-2 z-20 w-72 bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-[10px] uppercase tracking-widest text-text-dim font-bold">
                        Color Theme
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                      {(
                        Object.entries(THEME_CATALOG) as [
                          DiagramTheme,
                          (typeof THEME_CATALOG)[DiagramTheme],
                        ][]
                      ).map(([t, meta]) => {
                        const isActive = currentTheme === t;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setTheme(t);
                              setShowThemes(false);
                            }}
                            className={`relative flex flex-col items-start p-2.5 rounded-xl border transition-all duration-150 text-left group ${
                              isActive
                                ? 'border-transparent ring-1.5 ring-offset-1 ring-offset-surface scale-[0.98]'
                                : 'border-border/60 hover:border-border hover:scale-[1.02]'
                            }`}
                            style={{
                              background: isActive
                                ? `radial-gradient(ellipse at 70% 0%, ${meta.primary}22 0%, ${meta.bg} 65%)`
                                : meta.bg === '#ffffff'
                                  ? '#f8fafc'
                                  : `color-mix(in srgb, ${meta.bg} 80%, #ffffff 20%)`,
                              ...(isActive
                                ? {
                                    boxShadow: `0 0 0 1.5px ${meta.primary}88, 0 0 12px ${meta.primary}33`,
                                  }
                                : {}),
                            }}
                            title={`${meta.name} — ${meta.vibe}`}
                          >
                            {/* Color swatches */}
                            <div className="flex gap-1 mb-2">
                              <span
                                className="w-4 h-4 rounded-full border border-white/15 shadow-sm"
                                style={{
                                  backgroundColor: meta.bg === '#ffffff' ? '#e2e8f0' : meta.bg,
                                }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/15 shadow-sm"
                                style={{ backgroundColor: meta.primary }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white/15 shadow-sm"
                                style={{ backgroundColor: meta.accent }}
                              />
                            </div>
                            {/* Name */}
                            <span
                              className="text-[11px] font-semibold leading-none"
                              style={{ color: meta.bg === '#ffffff' ? '#0a0f1e' : '#f0f0f5' }}
                            >
                              {meta.name}
                            </span>
                            {/* Vibe */}
                            <span
                              className="text-[9px] leading-none mt-0.5 opacity-60"
                              style={{ color: meta.bg === '#ffffff' ? '#0a0f1e' : '#f0f0f5' }}
                            >
                              {meta.vibe}
                            </span>
                            {isActive && (
                              <span className="absolute top-1.5 right-1.5">
                                <Check className="w-2.5 h-2.5" style={{ color: meta.primary }} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3. Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* User Menu */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text border border-border hover:border-text-muted/50 rounded-lg transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {user.username || user.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth?.('signin')}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text border border-border hover:border-text-muted/50 rounded-lg transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}

            {showUserMenu && user && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-48 py-1 bg-surface border border-border rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-border">
                    <div className="text-sm font-medium text-text">{user.username || 'User'}</div>
                    <div className="text-xs text-text-muted truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <User className="w-4 h-4 text-text-muted" />
                    My Profile
                  </button>
                  <button
                    onClick={async () => {
                      const { signOut } = await import('../services/supabaseClient.ts');
                      await signOut();
                      setShowUserMenu(false);
                      window.location.reload();
                    }}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4 text-text-muted" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Publish Button */}
          <button
            onClick={onPublish}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-lg shadow-primary/20 transition-all"
            title="Publish to Community Gallery (Cmd+Shift+P)"
            aria-label="Publish diagram to community gallery"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Publish</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text border border-border hover:border-text-muted/50 rounded-lg transition-all"
              title="Share Diagram"
              aria-label="Share diagram"
              aria-expanded={showShareMenu}
              aria-haspopup="menu"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-52 py-1 bg-surface border border-border rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-text-muted font-bold border-b border-border/50 bg-surface-hover/30">
                    Share Diagram
                  </div>

                  <button
                    onClick={() => {
                      onShare();
                      setShowShareMenu(false);
                    }}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <Link2 className="w-4 h-4 text-primary" />
                    Get Share Link
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-muted" />
                    )}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>

                  <div className="h-px bg-border/50 my-1"></div>

                  <button
                    onClick={handleShareTwitter}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <Twitter className="w-4 h-4 text-sky-500" />
                    Share on Twitter
                  </button>

                  <button
                    onClick={handleShareLinkedIn}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    Share on LinkedIn
                  </button>

                  <button
                    onClick={handleShareEmail}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <Mail className="w-4 h-4 text-emerald-500" />
                    Share via Email
                  </button>

                  <div className="h-px bg-border/50 my-1"></div>

                  <button
                    onClick={() => {
                      setShowEmbedModal(true);
                      setShowShareMenu(false);
                    }}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <Code className="w-4 h-4 text-primary" />
                    Embed Diagram
                  </button>

                  <div className="h-px bg-border/50 my-1"></div>

                  <div className="px-4 py-2 text-[10px] text-text-muted">
                    Made with <span className="text-primary font-semibold">ArchiGram.ai</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ··· Overflow Menu */}
          <div className="relative">
            <button
              onClick={() => setShowOverflow(!showOverflow)}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
              title="More options"
              aria-label="More options"
              aria-expanded={showOverflow}
              aria-haspopup="menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showOverflow && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOverflow(false)} />
                <div
                  role="menu"
                  aria-label="More options"
                  className="absolute top-full right-0 mt-2 w-52 py-1 bg-surface border border-border rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-text-dim font-semibold border-b border-border/50">
                    Actions
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => {
                      onNewProject();
                      setShowOverflow(false);
                    }}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <Plus className="w-4 h-4 text-text-muted" />
                    New Project
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      onSaveVersion('Manual Save');
                      setShowOverflow(false);
                    }}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <Save className="w-4 h-4 text-text-muted" />
                    Save Checkpoint
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      onAudit();
                      setShowOverflow(false);
                    }}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <ShieldCheck className="w-4 h-4 text-text-muted" />
                    Run Audit
                  </button>
                  <div className="h-px bg-border/50 my-1" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      onExportSvg();
                      setShowOverflow(false);
                    }}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <FileCode className="w-4 h-4 text-text-muted" />
                    Export SVG
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      onExportPng();
                      setShowOverflow(false);
                    }}
                    className="text-left px-4 py-2.5 text-sm text-text hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <ImageIcon className="w-4 h-4 text-text-muted" />
                    Export PNG
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Embed Modal */}
        {showEmbedModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowEmbedModal(false)}
          >
            <div
              className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-text">Embed Diagram</h3>
                <button
                  onClick={() => setShowEmbedModal(false)}
                  className="p-2 text-text-muted hover:text-text rounded-lg transition-colors"
                  aria-label="Close embed modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode selector */}
              <div className="mb-4">
                <label className="block text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">
                  Mode
                </label>
                <div className="flex gap-2">
                  {(['minimal', 'toolbar', 'interactive'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setEmbedMode(m)}
                      aria-pressed={embedMode === m}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors capitalize ${
                        embedMode === m
                          ? 'bg-primary border-primary text-white'
                          : 'border-border text-text-muted hover:text-text hover:border-text-muted'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-text-muted mt-1.5">
                  {embedMode === 'minimal' && 'Diagram only, no chrome.'}
                  {embedMode === 'toolbar' && 'Diagram + zoom controls + ArchiGram badge.'}
                  {embedMode === 'interactive' && 'Toolbar + "Fork this diagram" button.'}
                </p>
              </div>

              {/* Size selector */}
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">
                    Width
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmbedWidth('100%')}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                        embedWidth === '100%'
                          ? 'bg-primary border-primary text-white'
                          : 'border-border text-text-muted hover:text-text'
                      }`}
                    >
                      100%
                    </button>
                    <input
                      type="number"
                      placeholder="px"
                      value={embedWidth.endsWith('px') ? embedWidth.slice(0, -2) : ''}
                      onChange={(e) =>
                        setEmbedWidth(e.target.value ? `${e.target.value}px` : '100%')
                      }
                      className="w-16 px-2 py-1.5 rounded-lg text-xs bg-background border border-border text-text placeholder-text-muted"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">
                    Height
                  </label>
                  <div className="flex gap-2">
                    {(['400', '500', '600'] as const).map((h) => (
                      <button
                        key={h}
                        onClick={() => setEmbedHeight(h)}
                        className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                          embedHeight === h
                            ? 'bg-primary border-primary text-white'
                            : 'border-border text-text-muted hover:text-text'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                    <input
                      type="number"
                      placeholder="px"
                      value={!['400', '500', '600'].includes(embedHeight) ? embedHeight : ''}
                      onChange={(e) => setEmbedHeight(e.target.value || '500')}
                      className="w-14 px-2 py-1.5 rounded-lg text-xs bg-background border border-border text-text placeholder-text-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Generated embed code */}
              <div className="mb-4">
                <label className="block text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">
                  Embed Code
                </label>
                <textarea
                  readOnly
                  value={embedCode}
                  rows={6}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs font-mono text-text resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <button
                onClick={handleCopyEmbed}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl transition-colors"
              >
                {embedCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {embedCopied ? 'Copied!' : 'Copy Embed Code'}
              </button>
            </div>
          </div>
        )}
      </header>

      <Suspense fallback={null}>
        <ShareEmailModal
          isOpen={showShareEmailModal}
          onClose={() => setShowShareEmailModal(false)}
          diagramTitle={activeProject?.name || 'Untitled Diagram'}
          diagramUrl={shareUrl}
          senderName={
            (user as unknown as { user_metadata?: { full_name?: string } })?.user_metadata
              ?.full_name ||
            user?.email ||
            'Someone'
          }
        />
      </Suspense>
    </>
  );
};

export default Header;
