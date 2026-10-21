import { Platform, Vibration } from 'react-native';

/** Short tap pulse used by the reference (`buzz`) on toggles, swipes and confirmations. */
export function buzz(ms = 8) {
  try {
    // iOS ignores custom durations and always plays the system pattern, so keep it to Android.
    if (Platform.OS === 'android') Vibration.vibrate(ms);
  } catch {
    // Vibration is best-effort.
  }
}
