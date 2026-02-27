'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { User } from '@/types';
import { getCurrentUser, onAuthStateChange, signOut } from '@/lib/supabase/browser';

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup';
  setAuthModalMode: (mode: 'signin' | 'signup') => void;
  requireAuth: (action: () => void) => void;
  openAuth: (mode: 'signin' | 'signup') => void;
  onAuthSuccess: (user: User) => void;
  handleSignOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const pendingAction = useRef<(() => void) | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);

    const {
      data: { subscription },
    } = onAuthStateChange(setUser);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const requireAuth = (action: () => void) => {
    if (user) {
      action();
    } else {
      pendingAction.current = action;
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
    }
  };

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const onAuthSuccess = (newUser: User) => {
    setUser(newUser);
    setIsAuthModalOpen(false);
    if (pendingAction.current) {
      pendingAction.current();
      pendingAction.current = null;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        requireAuth,
        openAuth,
        onAuthSuccess,
        handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
