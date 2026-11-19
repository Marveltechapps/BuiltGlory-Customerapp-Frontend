/** Indian number grouping, e.g. 8500000 → 85,00,000 (toLocaleString('en-IN')). */
export function groupIN(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(Math.round(n * 100) / 100).toString().split('.');
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const out = (rest ? rest + ',' : '') + last3 + (dec ? '.' + dec : '');
  return (neg ? '-' : '') + out;
}

/** Price label used across the design: ₹ 85 L, ₹ 2.45 Cr, ₹ 5,862. */
export function formatINR(n: number): string {
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  return `₹ ${groupIN(n)}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
