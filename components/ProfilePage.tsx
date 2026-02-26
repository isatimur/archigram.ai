import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Check,
  X,
  LogOut,
  Trash2,
  BarChart2,
  Heart,
  Layout,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { User as UserType, Project } from '../types.ts';
import { supabase, fetchUserDiagrams, deleteUserDiagram } from '../services/supabaseClient.ts';
import { toast } from 'sonner';

interface ProfilePageProps {
  user: UserType;
  projects: Project[];
  onSignOut: () => void;
  onOpenDiagram: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  projects,
  onSignOut,
  onOpenDiagram,
  onDeleteProject,
}) => {
  const [username, setUsername] = useState(user.username || '');
  const [editingUsername, setEditingUsername] = useState(false);
  const [cloudDiagrams, setCloudDiagrams] = useState<Project[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    fetchUserDiagrams(user.id).then(setCloudDiagrams);
  }, [user.id]);

  const saveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    const { error } = await supabase.auth.updateUser({ data: { username: trimmed } });
    if (error) {
      toast.error('Failed to update username');
    } else {
      toast.success('Username updated');
      setEditingUsername(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    toast.info('Please contact support to delete your account.');
    onSignOut();
  };

  const handleDeleteDiagram = async (id: string) => {
    const ok = await deleteUserDiagram(user.id, id);
    if (ok) {
      setCloudDiagrams((prev) => prev.filter((d) => d.id !== id));
      onDeleteProject(id);
    } else {
      toast.error('Failed to delete diagram');
    }
  };

  const initials = (user.username || user.email || 'U').slice(0, 2).toUpperCase();

  // Combine cloud and local, deduplicate by id (cloud wins)
  const allDiagrams = [
    ...cloudDiagrams,
    ...projects.filter((p) => !cloudDiagrams.find((c) => c.id === p.id)),
  ];

  return (
    <div className="min-h-screen bg-background text-text p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold select-none">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {editingUsername ? (
            <div className="flex items-center gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveUsername();
                  if (e.key === 'Escape') setEditingUsername(false);
                }}
                className="text-xl font-bold bg-surface border border-border rounded px-2 py-1 text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button
                onClick={saveUsername}
                aria-label="Save username"
                className="text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingUsername(false)}
                aria-label="Cancel"
                className="text-text-muted hover:text-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{user.username || 'Anonymous'}</h1>
              <button
                onClick={() => setEditingUsername(true)}
                aria-label="Edit username"
                className="text-text-muted hover:text-primary transition-colors flex-shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="text-sm text-text-muted truncate">{user.email}</div>
          {user.created_at && (
            <div className="text-xs text-text-muted mt-0.5">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text border border-border rounded-lg hover:bg-surface-hover transition-colors flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(
          [
            { icon: Layout, label: 'Diagrams', value: allDiagrams.length },
            { icon: Heart, label: 'Likes received', value: '—' },
            { icon: BarChart2, label: 'Published', value: cloudDiagrams.length },
          ] as const
        ).map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <Icon className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Diagrams */}
      <h2 className="text-lg font-bold mb-4">My Diagrams</h2>
      {allDiagrams.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Layout className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No diagrams yet. Create your first one in the editor!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {allDiagrams.map((diagram) => (
            <div
              key={diagram.id}
              className="bg-surface border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <h3 className="font-semibold text-sm mb-1 truncate">{diagram.name}</h3>
              <p className="text-xs text-text-muted mb-3">
                {new Date(diagram.updatedAt).toLocaleDateString()}
              </p>
              <pre className="text-xs text-text-muted bg-background rounded p-2 h-16 overflow-hidden mb-3 font-mono leading-relaxed">
                {diagram.code.slice(0, 120)}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenDiagram(diagram)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </button>
                <button
                  onClick={() => handleDeleteDiagram(diagram.id)}
                  aria-label={`Delete ${diagram.name}`}
                  className="flex items-center justify-center gap-1 text-xs px-2 py-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-xl p-4">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="flex items-center gap-2 text-red-500 text-sm font-medium w-full text-left"
        >
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </button>
        {showDangerZone && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              To delete your account, type <strong className="text-text">DELETE</strong> below and
              confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE'}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
