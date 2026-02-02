import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Github, Chrome, Loader2, AlertCircle } from 'lucide-react';
import { signUp, signIn, signInWithOAuth, getCurrentUser } from '../services/supabaseClient.ts';
import { User as UserType } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setUsername('');
      setError(null);
      setMessage(null);
    }
  }, [isOpen, initialMode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { user, error: signUpError } = await signUp(email, password, username);
        if (signUpError) {
          setError(signUpError);
          return;
        }
        if (user) {
          setMessage('Account created! Please check your email to verify your account.');
          // Auto sign in after successful signup
          setTimeout(async () => {
            const currentUser = await getCurrentUser();
            if (currentUser) {
              onAuthSuccess(currentUser);
              onClose();
            }
          }, 1000);
        }
      } else {
        const { user, error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError);
          return;
        }
        if (user) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            onAuthSuccess(currentUser);
            onClose();
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    setError(null);

    const { error } = await signInWithOAuth(provider);
    if (error) {
      setError(error);
      setIsLoading(false);
    }
    // OAuth redirects away, so we don't need to handle success here
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-hover/30">
          <h3 className="text-lg font-bold text-text">
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => handleOAuth('github')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background border border-border rounded-lg text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  <span className="font-medium">Continue with GitHub</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleOAuth('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background border border-border rounded-lg text-text hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Chrome className="w-5 h-5" />
                  <span className="font-medium">Continue with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-text-muted">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-lg text-sm font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center text-sm text-text-muted">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
