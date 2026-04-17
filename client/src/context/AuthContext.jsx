import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eb-progress') ?? 'null') ?? {
        wordsLearned: 0,
        writingScore: 0,
        sessionsCount: 0,
        level: 'B1',
        levelScores: { B1: 0, B2: 0, C1: 0, C2: 0 },
      };
    } catch (err) {
      console.warn('Could not parse saved progress from localStorage:', err);
      return { wordsLearned: 0, writingScore: 0, sessionsCount: 0, level: 'B1', levelScores: { B1: 0, B2: 0, C1: 0, C2: 0 } };
    }
  });

  // Load current session user from server
  useEffect(() => {
    api.getMe()
      .then(({ user: u }) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Sync progress with GitHub Gist once logged in
  useEffect(() => {
    if (!user) return;
    api.getProgress()
      .then(({ progress: p }) => {
        if (p) {
          setProgress(p);
          localStorage.setItem('eb-progress', JSON.stringify(p));
        }
      })
      .catch(() => {}); // silently fail — use local progress
  }, [user]);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
  }, []);

  const updateProgress = useCallback(async (updatesOrFn) => {
    setProgress((prev) => {
      const next = typeof updatesOrFn === 'function'
        ? { ...prev, ...updatesOrFn(prev) }
        : { ...prev, ...updatesOrFn };
      localStorage.setItem('eb-progress', JSON.stringify(next));
      return next;
    });
    // Persist to GitHub Gist — read the latest value after state update
    if (user) {
      setProgress((latest) => {
        api.saveProgress(latest).catch(() => {});
        return latest; // no actual state change, just for reading
      });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, progress, updateProgress, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
