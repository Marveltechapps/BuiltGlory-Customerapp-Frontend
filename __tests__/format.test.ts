import {
  dateKey,
  dayBucket,
  formatINR,
  formatPhone,
  formatRupees,
  fromIsoDate,
  groupIN,
  initials,
  isoDate,
  shortAge,
  timeAgo,
} from '../src/utils/format';

describe('Indian number formatting', () => {
  it('groups digits the Indian way', () => {
    expect(groupIN(250000)).toBe('2,50,000');
    expect(groupIN(12345678)).toBe('1,23,45,678');
    expect(groupIN(999)).toBe('999');
    expect(groupIN(-45000)).toBe('-45,000');
  });

  it('matches the reference formatINR rules', () => {
    expect(formatINR(24500000)).toBe('₹ 2.45 Cr');
    expect(formatINR(10000000)).toBe('₹ 1 Cr');
    expect(formatINR(8500000)).toBe('₹ 85 L');
    expect(formatINR(8250000)).toBe('₹ 82.50 L');
    expect(formatINR(45000)).toBe('₹ 45,000');
    expect(formatINR(null)).toBe('—');
    expect(formatRupees(250000)).toBe('₹ 2,50,000');
  });
});

describe('dates', () => {
  it('round-trips calendar days without timezone drift', () => {
    const d = fromIsoDate('2026-05-24');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(24);
    expect(isoDate(d)).toBe('2026-05-24');
    expect(dateKey('2026-05-24T00:00:00.000Z')).toBe('2026-05-24');
  });

  it('describes ages', () => {
    const now = new Date(2026, 5, 20, 12, 0).getTime();
    expect(timeAgo(new Date(now - 30 * 1000), now)).toBe('Just now');
    expect(timeAgo(new Date(now - 2 * 3600 * 1000), now)).toBe('2h ago');
    expect(timeAgo(new Date(now - 26 * 3600 * 1000), now)).toBe('Yesterday');
    expect(timeAgo(new Date(now - 3 * 86400 * 1000), now)).toBe('3 days ago');
    expect(shortAge(new Date(now - 5 * 3600 * 1000), now)).toBe('5h');
    expect(shortAge(new Date(now - 49 * 3600 * 1000), now)).toBe('2d');
  });

  it('buckets notifications by day', () => {
    const now = new Date(2026, 5, 20, 12, 0);
    expect(dayBucket(new Date(2026, 5, 20, 8, 0), now)).toBe('Today');
    expect(dayBucket(new Date(2026, 5, 19, 23, 0), now)).toBe('Yesterday');
    expect(dayBucket(new Date(2026, 5, 10, 9, 0), now)).toBe('Jun 10');
  });
});

describe('people', () => {
  it('formats phone numbers and initials', () => {
    expect(formatPhone('9876543210')).toBe('+91 98765 43210');
    expect(formatPhone('+91 98765 43210')).toBe('+91 98765 43210');
    expect(formatPhone('')).toBe('');
    expect(initials('Aarav Subramanian')).toBe('AS');
    expect(initials(null)).toBe('BG');
  });
});
