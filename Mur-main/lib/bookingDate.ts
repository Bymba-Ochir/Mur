/** Calendar date in the service's business timezone, independent of device timezone. */
export function ulaanbaatarDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ulaanbaatar', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function bookingEstimate(price: number | null, start: string, end: string): number | null {
  if (price == null || !Number.isFinite(price) || price < 0 || !start || !end || end < start) return null;
  const days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
  return Number.isFinite(days) && days >= 1 ? price * days : null;
}
