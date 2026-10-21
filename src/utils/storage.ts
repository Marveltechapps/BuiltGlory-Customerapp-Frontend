import AsyncStorage from '@react-native-async-storage/async-storage';

// Device-local preferences only (onboarding seen, coach marks, filter presets). Business data lives in the API.
export const STORAGE_KEYS = {
  onboardingSeen: 'bg.onboardingSeen',
  coachSeen: 'bg.coachSeen',
  termsAccepted: 'bg.termsAccepted',
  permissions: 'bg.permissions',
  appSettings: 'bg.appSettings',
  filterPreset: 'bg.filterPreset',
  recentlyViewed: 'bg.recentlyViewed',
  sellerAvailability: 'bg.sellerAvailability',
} as const;

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Preferences are best-effort.
  }
}
