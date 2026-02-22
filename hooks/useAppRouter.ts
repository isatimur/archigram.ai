import { useState, useEffect } from 'react';
import { AppView } from '../types.ts';
import { PROJECTS_STORAGE_KEY } from '../constants.ts';

export function useAppRouter() {
  const [currentView, setCurrentView] = useState<AppView>('landing');

  useEffect(() => {
    const hasHash = window.location.hash.length > 1;
    const hasProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);

    if (hasHash || hasProjects) {
      setCurrentView('app');
    }
  }, []);

  return { currentView, setCurrentView };
}
