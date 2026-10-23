'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Where RouteGuard sends the user once they're signed in (first-timers go to /welcome).
  const [nextPath, setNextPath] = useState('/dashboard');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    if (token && userName) {
      setUser({ token, userName });
    }
    setLoading(false);
  }, []);

  const login = useCallback((token, userName, { onboarded = true } = {}) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', userName);
    setNextPath(onboarded ? '/dashboard' : '/welcome');
    setUser({ token, userName });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, nextPath }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
