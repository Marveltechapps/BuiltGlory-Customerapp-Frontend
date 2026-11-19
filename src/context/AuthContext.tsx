import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { setSessionExpiredListener } from '../api';
import type { AppConfigApi, UserApi } from '../api/types';
import {
  clearSession,
  loadSession,
  saveTokens,
  session,
  updateUser,
  type SessionUser,
} from '../lib/session';
import { setTokenAmount } from './journeyStore';
import * as appConfigService from '../services/appConfig.service';
import * as authService from '../services/auth.service';
import * as meService from '../services/me.service';
import { disconnectSocket } from '../services/socket.service';

type SessionExpiredHandler = () => void;

export type AuthContextValue = {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  appConfig: AppConfigApi | null;
  loginWithSession: (
    tokens: { accessToken: string; refreshToken: string },
    user?: SessionUser | null,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserApi | null>;
  loadAppConfig: () => Promise<AppConfigApi | null>;
  onSessionExpired: (handler: SessionExpiredHandler) => () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [appConfig, setAppConfig] = useState<AppConfigApi | null>(null);
  const expiredHandlers = useRef(new Set<SessionExpiredHandler>());

  const notifySessionExpired = useCallback(() => {
    expiredHandlers.current.forEach((handler) => {
      try {
        handler();
      } catch {
        // ignore listener errors
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadSession();
        if (cancelled) return;
        setUser(loaded.user);
        setHasToken(Boolean(loaded.accessToken));
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredListener(() => {
      void (async () => {
        await clearSession();
        setUser(null);
        setHasToken(false);
        notifySessionExpired();
      })();
    });
    return () => setSessionExpiredListener(null);
  }, [notifySessionExpired]);

  const loginWithSession = useCallback(
    async (
      tokens: { accessToken: string; refreshToken: string },
      nextUser?: SessionUser | null,
    ) => {
      await saveTokens(tokens.accessToken, tokens.refreshToken, nextUser ?? session.user);
      setUser(nextUser ?? session.user);
      setHasToken(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = session.refreshToken;
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // Clear local session even if the network call fails.
    }
    disconnectSocket();
    await clearSession();
    setUser(null);
    setHasToken(false);
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserApi | null> => {
    if (!session.accessToken) {
      setUser(null);
      setHasToken(false);
      return null;
    }
    try {
      const me = await meService.getMe();
      await updateUser(me);
      setUser(me);
      setHasToken(true);
      return me;
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      if (code === 'SESSION_EXPIRED') {
        await clearSession();
        setUser(null);
        setHasToken(false);
        notifySessionExpired();
      }
      throw error;
    }
  }, [notifySessionExpired]);

  const loadAppConfig = useCallback(async (): Promise<AppConfigApi | null> => {
    const config = await appConfigService.getAppConfig();
    setAppConfig(config);
    setTokenAmount(config?.payment?.tokenAmount);
    return config;
  }, []);

  const onSessionExpired = useCallback((handler: SessionExpiredHandler) => {
    expiredHandlers.current.add(handler);
    return () => {
      expiredHandlers.current.delete(handler);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: hasToken,
      isHydrating,
      appConfig,
      loginWithSession,
      logout,
      refreshProfile,
      loadAppConfig,
      onSessionExpired,
    }),
    [
      user,
      hasToken,
      isHydrating,
      appConfig,
      loginWithSession,
      logout,
      refreshProfile,
      loadAppConfig,
      onSessionExpired,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
