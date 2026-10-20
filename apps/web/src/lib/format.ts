// Vietnamese formatting helpers. Date-only values from the API are "YYYY-MM-DD" strings.

export function formatDate(dateOnly: string): string {
  const [year, month, day] = dateOnly.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Whole days from a date-only string until today (local time). */
export function daysSince(dateOnly: string): number {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const start = new Date(year!, month! - 1, day!);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86_400_000);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

/** Today as "YYYY-MM-DD" in local time, for `min` on date inputs. */
export function todayDateOnly(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Days until the next yearly recurrence of a date (birthday, anniversary). 0 = today. */
export function daysUntilNextOccurrence(dateOnly: string): number {
  const [, month, day] = dateOnly.split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), month! - 1, day!);
  if (next < today) next = new Date(today.getFullYear() + 1, month! - 1, day!);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}
