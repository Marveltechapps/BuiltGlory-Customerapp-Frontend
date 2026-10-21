import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApiError } from '../api';
import {
  clearSession,
  loadSession,
  onSessionExpired,
  saveSession,
} from '../api/session';
import * as authService from '../services/auth.service';
import { getMe, updateMe } from '../services/user.service';
import type { LoginResponse } from '../types/auth';
import type { UpdateMeRequest, User } from '../types/user';

export type AuthStatus = 'booting' | 'signedOut' | 'guest' | 'signedIn';

interface AuthValue {
  status: AuthStatus;
  user: User | null;
  isGuest: boolean;
  isSignedIn: boolean;
  /** Restore a stored session and load GET /me. Network failures are rethrown so the splash can show G-01. */
  bootstrap(): Promise<AuthStatus>;
  completeLogin(result: LoginResponse): Promise<User>;
  enterGuest(): void;
  refreshUser(): Promise<User | null>;
  saveProfile(patch: UpdateMeRequest): Promise<User>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('booting');
  const [user, setUser] = useState<User | null>(null);

  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus('signedOut');
      }),
    [],
  );

  const bootstrap = useCallback(async () => {
    const session = await loadSession();
    if (!session) {
      setStatus('signedOut');
      return 'signedOut' as const;
    }
    try {
      const me = await getMe();
      setUser(me);
      setStatus('signedIn');
      return 'signedIn' as const;
    } catch (error) {
      if (error instanceof ApiError && error.isNetwork) throw error;
      // Invalid or revoked session.
      await clearSession();
      setUser(null);
      setStatus('signedOut');
      return 'signedOut' as const;
    }
  }, []);

  const completeLogin = useCallback(async (result: LoginResponse) => {
    await saveSession({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    setUser(result.user);
    setStatus('signedIn');
    return result.user;
  }, []);

  const enterGuest = useCallback(() => {
    setUser(null);
    setStatus('guest');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const saveProfile = useCallback(async (patch: UpdateMeRequest) => {
    const next = await updateMe(patch);
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Revocation is best-effort; the local session is cleared regardless.
    }
    await clearSession();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      isGuest: status === 'guest',
      isSignedIn: status === 'signedIn',
      bootstrap,
      completeLogin,
      enterGuest,
      refreshUser,
      saveProfile,
      logout,
    }),
    [
      status,
      user,
      bootstrap,
      completeLogin,
      enterGuest,
      refreshUser,
      saveProfile,
      logout,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
