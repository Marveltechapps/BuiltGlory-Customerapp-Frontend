const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3));
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export { MONTHS, MONTHS_SHORT, DAYS_SHORT };

/** Indian digit grouping (12,34,567) without relying on Intl data. */
export function groupIN(value: number): string {
  const negative = value < 0;
  const [int, frac] = Math.abs(Math.round(value * 100) / 100)
    .toString()
    .split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = rest ? `${rest},${last3}` : last3;
  return `${negative ? '-' : ''}${grouped}${frac ? `.${frac}` : ''}`;
}

/** Same rules as the reference `formatINR`: ₹ 2.45 Cr, ₹ 85 L, ₹ 45,000. */
export function formatINR(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  if (n >= 10000000)
    return `₹ ${(n / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  return `₹ ${groupIN(n)}`;
}

/** Full rupee amount: ₹ 2,50,000 */
export function formatRupees(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `₹ ${groupIN(n)}`;
}

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "May 24, 2026" */
export function formatLongDate(
  value: string | Date | null | undefined,
): string {
  const d = toDate(value);
  return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : '—';
}

/** "May 12, 2026" with short month: "Jun 10, 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d
    ? `${MONTHS_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(
        2,
        '0',
      )}, ${d.getFullYear()}`
    : '—';
}

/** "Jun 20" */
export function formatShortDate(
  value: string | Date | null | undefined,
): string {
  const d = toDate(value);
  return d ? `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}` : '—';
}

/** "Jun 12 · 10:24 AM" */
export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  const d = toDate(value);
  return d ? `${formatShortDate(d)} · ${formatTime(d)}` : '—';
}

/** "10:24 AM" */
export function formatTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "2h ago", "Yesterday", "3 days ago", "2 weeks ago" */
export function timeAgo(
  value: string | Date | null | undefined,
  now = Date.now(),
): string {
  const d = toDate(value);
  if (!d) return '';
  const diff = Math.max(0, now - d.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  return formatDate(d);
}

/** Compact age used in notification rows: "2h", "1d". */
export function shortAge(
  value: string | Date | null | undefined,
  now = Date.now(),
): string {
  const d = toDate(value);
  if (!d) return '';
  const min = Math.floor(Math.max(0, now - d.getTime()) / 60000);
  if (min < 60) return `${Math.max(min, 1)}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** Day bucket for grouped lists: Today / Yesterday / "Jun 10". */
export function dayBucket(
  value: string | Date | null | undefined,
  now = new Date(),
): string {
  const d = toDate(value);
  if (!d) return '';
  const start = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(now) - start(d)) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return formatShortDate(d);
}

/** YYYY-MM-DD in local time (the visits API compares calendar dates). */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parse "YYYY-MM-DD" as a local calendar date. */
export function fromIsoDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatPhone(raw?: string | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '').slice(-10);
  return digits.length === 10
    ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    : raw;
}

export function initials(name?: string | null): string {
  if (!name) return 'BG';
  const parts = name.trim().split(/\s+/);
  return (
    (
      (parts[0]?.[0] ?? '') +
      (parts.length > 1 ? parts[parts.length - 1][0] : '')
    ).toUpperCase() || 'BG'
  );
}

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/** Calendar day of an API date (`2026-05-24T00:00:00.000Z` → `2026-05-24`), matching the backend's own day keys. */
export const dateKey = (value: string) => value.slice(0, 10);
