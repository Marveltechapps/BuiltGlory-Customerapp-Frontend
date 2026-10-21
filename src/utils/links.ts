import { Linking } from 'react-native';
import { isoDate } from './format';

export async function openUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export const callPhone = (phone: string) =>
  openUrl(`tel:${phone.replace(/[^\d+]/g, '')}`);

export const sendEmail = (to: string, subject = 'Support Request') =>
  openUrl(`mailto:${to}?subject=${encodeURIComponent(subject)}`);

/** Google Maps search for coordinates when known, otherwise the address text. */
export function mapsUrl(opts: {
  latitude?: number | null;
  longitude?: number | null;
  query?: string;
}) {
  if (typeof opts.latitude === 'number' && typeof opts.longitude === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${opts.latitude},${opts.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    opts.query ?? '',
  )}`;
}

/** Google Calendar "add event" template (opens in the browser or Calendar app). */
export function calendarUrl(
  title: string,
  start: Date,
  durationMinutes: number,
  location?: string,
) {
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const fmt = (d: Date) =>
    `${isoDate(d).replace(/-/g, '')}T${String(d.getHours()).padStart(
      2,
      '0',
    )}${String(d.getMinutes()).padStart(2, '0')}00`;
  const params = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(title)}`,
    `dates=${fmt(start)}/${fmt(end)}`,
    location ? `location=${encodeURIComponent(location)}` : '',
  ].filter(Boolean);
  return `https://calendar.google.com/calendar/render?${params.join('&')}`;
}

/** Public property link served by the backend's App Links host (`/p/:id`). */
export const propertyLink = (id: string) => `https://builtglory.app/p/${id}`;
