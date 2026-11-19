// Date labels in the formats the design produces with toLocale*String('en-IN', …).
// Written out by hand so Android and iOS render the same text.

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function clock(d: Date): string {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`;
}

/** { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' } → "14 Nov, 5:23 pm" */
export function formatDayTime(t: number | Date | null | undefined): string {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${clock(d)}`;
}

/** { month: 'short', day: 'numeric', year: 'numeric' } → "14 Nov 2026" */
export function formatDateShort(t: number | Date): string {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** { weekday: 'short', day: 'numeric', month: 'short' } → "Sat, 14 Nov" */
export function formatWeekdayDate(t: number | Date): string {
  const d = new Date(t);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** { day: 'numeric', month: 'short' } → "14 Nov" */
export function formatDayMonth(t: number | Date): string {
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** { hour: 'numeric', minute: '2-digit' } → "5:23 pm" */
export function formatTime(t: number | Date): string {
  return clock(new Date(t));
}
