import React, { useState, useEffect, lazy, Suspense } from 'react';
import { trendingScore } from '../utils/trending.ts';
import {
  Search,
  GitFork,
  Heart,
  Eye,
  ArrowLeft,
  Globe,
  Star,
  TrendingUp,
  Clock,
  Zap,
  Link as LinkIcon,
  Download,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppView, CommunityDiagram, User } from '../types.ts';
import { COMMUNITY_DATA, LIKED_IDS_KEY } from '../constants.ts';
import DiagramPreview from './DiagramPreview.tsx';
import { decodeCodeFromUrl } from '../utils/url.ts';
import {
  fetchCommunityDiagrams,
  fetchCommentCounts,
  updateDiagramLikes,
  incrementDiagramViews,
} from '../services/supabaseClient.ts';
import { analytics } from '../utils/analytics.ts';

const CommentThread = lazy(() => import('./CommentThread.tsx'));

interface CommunityGalleryProps {
  onNavigate: (view: AppView) => void;
  onFork: (diagram: CommunityDiagram) => void;
  user?: User | null;
  onOpenAuth?: () => void;
}

const CommunityGallery: React.FC<CommunityGalleryProps> = ({
  onNavigate,
  onFork,
  user,
  onOpenAuth,
}) => {
  const [filter, setFilter] = useState<'trending' | 'new' | 'top'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState('');

  // Data State
  const [diagrams, setDiagrams] = useState<CommunityDiagram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Comment State
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

  // Load Likes from Local Storage
  useEffect(() => {
    const saved = localStorage.getItem(LIKED_IDS_KEY);
    if (saved) {
      try {
        setLikedIds(new Set(JSON.parse(saved)));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Fetch Data on Mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const result = await fetchCommunityDiagrams({ limit: 100 });

      let loadedDiagrams: CommunityDiagram[];
      if (result.data && result.data.length > 0) {
        loadedDiagrams = result.data;
      } else {
        loadedDiagrams = COMMUNITY_DATA;
      }
      setDiagrams(loadedDiagrams);

      // Load comment counts
      const ids = loadedDiagrams.map((d) => d.id);
      const counts = await fetchCommentCounts(ids);
      setCommentCounts(counts);

      setIsLoading(false);
    };
    loadData();
  }, []);

  const filteredBySearch = diagrams.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredData = [...filteredBySearch].sort((a, b) => {
    if (filter === 'trending') {
      return (
        trendingScore(b.likes, b.views, b.createdAtTimestamp ?? 0) -
        trendingScore(a.likes, a.views, a.createdAtTimestamp ?? 0)
      );
    }
    if (filter === 'top') {
      return b.likes - a.likes;
    }
    if (filter === 'new') {
      const tsA = a.createdAtTimestamp ?? 0;
      const tsB = b.createdAtTimestamp ?? 0;
      return tsB - tsA;
    }
    return 0;
  });

  const handleLike = async (e: React.MouseEvent, id: string, currentLikes: number) => {
    e.stopPropagation();

    const isLiked = likedIds.has(id);
    const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    // Optimistic UI Update
    const newLikedIds = new Set(likedIds);
    if (isLiked) newLikedIds.delete(id);
    else newLikedIds.add(id);

    setLikedIds(newLikedIds);
    localStorage.setItem(LIKED_IDS_KEY, JSON.stringify(Array.from(newLikedIds)));

    setDiagrams((prev) => prev.map((d) => (d.id === id ? { ...d, likes: newLikes } : d)));

    // Analytics
    if (!isLiked) analytics.diagramLiked();

    // API Call
    const success = await updateDiagramLikes(id, newLikes);

    if (!success) {
      // Revert if API fails
      toast.error('Failed to update like');
      setDiagrams((prev) => prev.map((d) => (d.id === id ? { ...d, likes: currentLikes } : d)));
      setLikedIds((prev) => {
        const reverted = new Set(prev);
        if (isLiked) reverted.add(id);
        else reverted.delete(id);
        localStorage.setItem(LIKED_IDS_KEY, JSON.stringify(Array.from(reverted)));
        return reverted;
      });
    }
  };

  const handleForkWithStats = (diagram: CommunityDiagram) => {
    // Fire and forget view increment for analytics
    incrementDiagramViews(diagram.id);
    // Execute original fork behavior
    onFork(diagram);
  };

  const handleImport = () => {
    setImportError('');
    if (!importUrl) return;

    try {
      // 1. Extract hash
      let hash = '';
      if (importUrl.includes('#')) {
        hash = importUrl.split('#')[1];
      } else {
        // assume the whole string might be the hash if no # present
        hash = importUrl;
      }

      // 2. Decode
      const code = decodeCodeFromUrl(hash);
      if (!code) {
        setImportError('Invalid or corrupted link.');
        return;
      }

      // 3. Create simulated diagram object
      const importedDiagram: CommunityDiagram = {
        id: `imported-${Date.now()}`,
        title: 'Imported Diagram',
        author: 'External User',
        description: 'Imported via shared link.',
        code: code,
        likes: 0,
        views: 0,
        tags: ['Imported'],
        createdAt: 'Just now',
      };

      onFork(importedDiagram);
      setShowImport(false);
      setImportUrl('');
    } catch {
      setImportError('Failed to parse URL.');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-text flex flex-col font-sans overflow-hidden relative">
      {/* Navbar */}
      <nav className="h-14 md:h-16 border-b border-border bg-surface/50 backdrop-blur-xl flex items-center justify-between px-3 md:px-6 shrink-0 z-50 gap-2">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button
            onClick={() => onNavigate('landing')}
            className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-border hidden md:block"></div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent hidden sm:block" />
            <span className="font-bold text-sm md:text-lg tracking-tight hidden sm:inline">
              Community Gallery
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-md mx-1 md:mx-4">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary focus:bg-surface-hover transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 p-2 md:px-3 md:py-2 text-sm font-medium text-text-muted hover:text-text border border-border hover:bg-surface rounded-lg transition-all"
            title="Import from URL"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Import</span>
          </button>

          <button
            onClick={() => onNavigate('app')}
            className="bg-primary hover:bg-primary-hover text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <span className="hidden sm:inline">My Workspace</span>
            <span className="sm:hidden">Studio</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border p-6 md:p-10">
        {/* Header / Stats */}
        <div className="max-w-7xl mx-auto mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 mb-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Discover & Fork</h1>
              <p className="text-text-muted max-w-xl text-sm md:text-base">
                Explore architecture diagrams built by engineers. Fork any diagram to start
                customizing.
              </p>
            </div>
            <div className="flex gap-1 md:gap-2 bg-surface border border-border p-1 rounded-xl shrink-0 self-start">
              <FilterButton
                active={filter === 'trending'}
                onClick={() => setFilter('trending')}
                icon={<TrendingUp className="w-4 h-4" />}
              >
                Trending
              </FilterButton>
              <FilterButton
                active={filter === 'new'}
                onClick={() => setFilter('new')}
                icon={<Clock className="w-4 h-4" />}
              >
                Newest
              </FilterButton>
              <FilterButton
                active={filter === 'top'}
                onClick={() => setFilter('top')}
                icon={<Star className="w-4 h-4" />}
              >
                Top Rated
              </FilterButton>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-text-muted">Loading community diagrams...</p>
            </div>
          ) : (
            /* Masonry Grid */
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredData.map((diagram) => (
                <div
                  key={diagram.id}
                  className="group bg-surface border border-border hover:border-primary/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 break-inside-avoid"
                  onMouseEnter={() => setHoveredId(diagram.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Preview Area - Aspect Ratio Variable */}
                  <div
                    className="relative bg-[#131316] border-b border-border/50 overflow-hidden cursor-pointer"
                    onClick={() => handleForkWithStats(diagram)}
                  >
                    <div className="p-2 min-h-[150px] max-h-[300px] flex items-center justify-center overflow-hidden">
                      <div className="pointer-events-none transform scale-[0.8] origin-center w-full h-full flex items-center justify-center">
                        <DiagramPreview
                          code={diagram.code}
                          onError={() => {}}
                          theme="midnight"
                          showControls={false}
                        />
                      </div>
                    </div>

                    {/* Overlay Fork Button */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${hoveredId === diagram.id ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleForkWithStats(diagram);
                        }}
                        className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl transform scale-90 group-hover:scale-100 transition-all"
                      >
                        <GitFork className="w-5 h-5" />
                        Fork Diagram
                      </button>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-text group-hover:text-primary transition-colors line-clamp-1">
                        {diagram.title}
                      </h3>
                      <span className="text-[10px] bg-surface-hover border border-border text-text-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                        {diagram.createdAt}
                      </span>
                    </div>

                    <p className="text-sm text-text-muted line-clamp-3 mb-4">
                      {diagram.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {diagram.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {diagram.author.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs text-text-muted font-medium hover:text-text cursor-pointer">
                          @{diagram.author}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <button
                          onClick={(e) => handleLike(e, diagram.id, diagram.likes)}
                          className={`flex items-center gap-1.5 transition-all group/like ${
                            likedIds.has(diagram.id)
                              ? 'text-red-500'
                              : 'text-text-muted hover:text-red-400'
                          }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-transform ${
                              likedIds.has(diagram.id)
                                ? 'fill-current scale-110'
                                : 'group-hover/like:scale-110'
                            }`}
                          />
                          <span className="font-medium">{formatNumber(diagram.likes)}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCommentId(
                              expandedCommentId === diagram.id ? null : diagram.id
                            );
                          }}
                          className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="font-medium">{commentCounts[diagram.id] || 0}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {formatNumber(diagram.views)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Comment Thread */}
                  {expandedCommentId === diagram.id && (
                    <Suspense
                      fallback={
                        <div className="px-5 py-4 border-t border-border/50 flex justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                        </div>
                      }
                    >
                      <CommentThread
                        diagramId={diagram.id}
                        user={user || null}
                        onOpenAuth={onOpenAuth}
                      />
                    </Suspense>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State / CTA */}
          {!isLoading && filteredData.length === 0 && (
            <div className="mt-20 p-10 rounded-2xl bg-gradient-to-br from-surface to-surface-hover border border-border text-center">
              <p className="text-text-muted">No diagrams found matching your search.</p>
            </div>
          )}

          {!isLoading && (
            <div className="mt-20 p-10 rounded-2xl bg-gradient-to-br from-surface to-surface-hover border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Contribution Rewards Program</h3>
              <p className="text-text-muted max-w-lg mx-auto mb-6">
                Publish your best diagrams to the community. Top contributors receive Archigram Pro
                for free and exclusive profile badges.
              </p>
              <button
                onClick={() => onNavigate('app')}
                className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
              >
                Create Submission
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Import Modal */}
      {showImport && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Import from Link
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Paste a shared Archigram URL to fork the diagram into your workspace.
            </p>

            <input
              type="text"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://archigram.ai/#..."
              className="w-full bg-background border border-border rounded-lg p-3 text-sm text-text focus:outline-none focus:border-primary mb-2"
              autoFocus
            />

            {importError && <p className="text-xs text-red-500 mb-3">{importError}</p>}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowImport(false);
                  setImportUrl('');
                  setImportError('');
                }}
                className="px-4 py-2 text-sm text-text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-white rounded-lg"
              >
                Import Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterButton = ({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-background text-text shadow-sm ring-1 ring-border'
        : 'text-text-muted hover:text-text hover:bg-surface-hover'
    }`}
  >
    {icon}
    {children}
  </button>
);

const formatNumber = (num: number) => {
  return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString();
};

export default CommunityGallery;
