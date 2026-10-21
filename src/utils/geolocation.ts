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
    error?: () => void,
    options?: GeoOptions,
  ): void;
}

/** Browser and some WebView runtimes expose this. Native builds usually do not. */
export function readGeolocation(): GeolocationHandle | null {
  const host = globalThis as { navigator?: { geolocation?: GeolocationHandle } };
  return host.navigator?.geolocation ?? null;
}
