const DAY_MS = 24 * 60 * 60 * 1000;

export function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

export function startOfDay(value: string | Date): Date {
  const d = new Date(toDate(value));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(value: string | Date): Date {
  const d = new Date(toDate(value));
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  const da = toDate(a);
  const db = toDate(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function isToday(value: string | Date): boolean {
  return isSameDay(value, new Date());
}

export function isYesterday(value: string | Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(value, y);
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const da = startOfDay(a).getTime();
  const db = startOfDay(b).getTime();
  return Math.round((db - da) / DAY_MS);
}

export function startOfWeek(value: string | Date): Date {
  const d = startOfDay(value);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(value: string | Date, amount: number): Date {
  const d = new Date(toDate(value));
  d.setDate(d.getDate() + amount);
  return d;
}

export function formatDate(value: string | Date): string {
  const d = toDate(value);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(value: string | Date): string {
  const d = toDate(value);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatTime(value: string | Date): string {
  const d = toDate(value);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value: string | Date): string {
  return `${formatShortDate(value)} · ${formatTime(value)}`;
}

export function formatRelativeDay(value: string | Date): string {
  if (isToday(value)) return 'Today';
  if (isYesterday(value)) return 'Yesterday';
  const diff = daysBetween(value, new Date());
  if (diff >= 0 && diff < 7) return toDate(value).toLocaleDateString(undefined, { weekday: 'long' });
  return formatDate(value);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export interface AgeBreakdown {
  days: number;
  weeks: number;
  months: number;
  years: number;
  label: string;
}

export function calculateAge(dateOfBirth: string): AgeBreakdown {
  const birth = startOfDay(dateOfBirth);
  const today = startOfDay(new Date());
  const totalDays = Math.max(0, daysBetween(birth, today));
  const weeks = Math.floor(totalDays / 7);
  const years = Math.floor(totalDays / 365.25);
  const months = Math.floor(totalDays / 30.4368);

  let label: string;
  if (totalDays < 14) {
    label = `${totalDays} day${totalDays === 1 ? '' : 's'} old`;
  } else if (totalDays < 60) {
    label = `${weeks} week${weeks === 1 ? '' : 's'} old`;
  } else if (months < 24) {
    label = `${months} month${months === 1 ? '' : 's'} old`;
  } else {
    const remMonths = months % 12;
    label = remMonths > 0 ? `${years}y ${remMonths}m old` : `${years} year${years === 1 ? '' : 's'} old`;
  }

  return { days: totalDays, weeks, months, years, label };
}

export function last7Days(): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
}

export function mergeDatePart(base: Date, datePart: Date): Date {
  const d = new Date(base);
  d.setFullYear(datePart.getFullYear(), datePart.getMonth(), datePart.getDate());
  return d;
}

export function mergeTimePart(base: Date, timePart: Date): Date {
  const d = new Date(base);
  d.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  return d;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
