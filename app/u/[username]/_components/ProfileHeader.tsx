import { ExternalLink } from 'lucide-react';
import type { PublicProfile } from '@/lib/supabase/server';

type Props = { profile: PublicProfile };

export function ProfileHeader({ profile }: Props) {
  const initials = (profile.username || 'U').slice(0, 2).toUpperCase();
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="border-b border-[rgb(var(--border))]">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-[rgb(var(--border))]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[rgb(var(--primary))] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-[rgb(var(--text))]">@{profile.username}</h1>

            {profile.bio && (
              <p className="text-[rgb(var(--text-muted))] mt-1 max-w-lg">{profile.bio}</p>
            )}

            {profile.social_link && (
              <a
                href={profile.social_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-[rgb(var(--primary))] hover:underline mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                {profile.social_link.replace(/^https?:\/\//, '')}
              </a>
            )}

            {/* Stats */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-6 mt-4">
              <div className="text-center">
                <span className="text-xl font-bold text-[rgb(var(--text))]">
                  {profile.diagram_count}
                </span>
                <p className="text-xs text-[rgb(var(--text-muted))]">Diagrams</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-[rgb(var(--text))]">
                  {profile.total_likes}
                </span>
                <p className="text-xs text-[rgb(var(--text-muted))]">Likes</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-[rgb(var(--text))]">{joinDate}</span>
                <p className="text-xs text-[rgb(var(--text-muted))]">Joined</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
