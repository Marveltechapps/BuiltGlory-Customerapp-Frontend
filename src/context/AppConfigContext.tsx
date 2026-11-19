import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { getAppConfig } from '../services/appConfig.service';
import type { AppConfig } from '../types/appConfig';

export const APP_VERSION = '1.0.0';

interface AppConfigValue {
  config: AppConfig | null;
  load(): Promise<AppConfig>;
  /** True when the installed version is below `versions.minimumSupported` (G-02). */
  updateRequired: boolean;
  /** Support phone in display form, from the backend company contact config. */
  supportPhone: string | null;
  supportEmail: string | null;
}

const AppConfigContext = createContext<AppConfigValue | null>(null);

/** Compare dotted versions numerically: -1, 0, 1. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const load = useCallback(async () => {
    const next = await getAppConfig();
    setConfig(next);
    return next;
  }, []);
  const value = useMemo<AppConfigValue>(
    () => ({
      config,
      load,
      updateRequired: config
        ? compareVersions(APP_VERSION, config.versions.minimumSupported) < 0
        : false,
      supportPhone:
        config?.support?.phone || config?.support?.supportPhone || null,
      supportEmail: config?.support?.supportEmail || null,
    }),
    [config, load],
  );
  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig(): AppConfigValue {
  const ctx = useContext(AppConfigContext);
  if (!ctx)
    throw new Error('useAppConfig must be used inside AppConfigProvider');
  return ctx;
}
