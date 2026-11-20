import { PermissionsAndroid, Platform } from 'react-native';

export interface GeoPosition {
  coords: { latitude: number; longitude: number };
}

interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface GeolocationHandle {
  getCurrentPosition(
    success: (position: GeoPosition) => void,
    error?: (error: { message?: string }) => void,
    options?: GeoOptions,
  ): void;
}

function browserGeolocation(): GeolocationHandle | null {
  const host = globalThis as { navigator?: { geolocation?: GeolocationHandle } };
  return host.navigator?.geolocation ?? null;
}

function nativeGeolocation(): GeolocationHandle | null {
  try {
    const mod = require('@react-native-community/geolocation');
    return (mod?.default || mod) as GeolocationHandle;
  } catch {
    return null;
  }
}

async function allowNativeLocation(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
    title: 'Location',
    message: 'Builtglory uses your location to show nearby listings and pin a property address.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/** Device GPS when the runtime provides it. Returns null when the user denies it or the device has no provider. */
export function readCurrentPosition(options?: GeoOptions): Promise<GeoPosition | null> {
  const geo = browserGeolocation() || nativeGeolocation();
  if (!geo) return Promise.resolve(null);
  return allowNativeLocation().then((allowed) => {
    if (!allowed) return null;
    return new Promise((resolve) => {
      geo.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000, ...options },
      );
    });
  }).catch(() => null);
}

/** Browser and some WebView runtimes expose this. Native builds use readCurrentPosition. */
export function readGeolocation(): GeolocationHandle | null {
  return browserGeolocation() || nativeGeolocation();
}
