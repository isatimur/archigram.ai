import { Heart, Eye } from 'lucide-react';
import type { PublicDiagram } from '@/lib/supabase/server';

type Props = { diagrams: PublicDiagram[] };

export function DiagramGrid({ diagrams }: Props) {
  if (diagrams.length === 0) {
    return (
      <div className="text-center py-16 text-[rgb(var(--text-muted))]">
        <p className="text-lg">No published diagrams yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {diagrams.map((diagram) => (
        <a
          key={diagram.id}
          href={`/gallery?highlight=${diagram.id}`}
          className="block bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl p-4 hover:border-[rgb(var(--primary))] transition-colors group"
        >
          {/* Code preview */}
          <pre className="text-xs text-[rgb(var(--text-muted))] font-mono overflow-hidden h-24 whitespace-pre-wrap break-words leading-relaxed">
            {diagram.code.slice(0, 150)}
            {diagram.code.length > 150 ? '…' : ''}
          </pre>

          <div className="mt-3 border-t border-[rgb(var(--border))] pt-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--text))] truncate group-hover:text-[rgb(var(--primary))] transition-colors">
              {diagram.title}
            </h3>

            {diagram.description && (
              <p className="text-xs text-[rgb(var(--text-muted))] mt-1 line-clamp-2">
                {diagram.description}
              </p>
            )}

            {/* Tags */}
            {diagram.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {diagram.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 mt-2 text-xs text-[rgb(var(--text-muted))]">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {diagram.likes ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {diagram.views ?? 0}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
