// Date-only columns (@db.Date) come back from Prisma as UTC midnight. Converting through UTC on
// both sides keeps "2024-02-14" as the 14th regardless of the server's time zone.

export function toDateOnly(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

export function fromDateOnly(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

/** Today in Vietnam (UTC+7), as UTC midnight — what "expires on X" means to the people using it. */
export function todayInVietnam(): Date {
  const nowInVietnam = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return fromDateOnly(nowInVietnam.toISOString().slice(0, 10))!;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today in Vietnam as "YYYY-MM-DD". */
export function todayDateOnlyInVietnam(): string {
  return toDateOnly(todayInVietnam())!;
}

/** Whole days from date-only `from` to date-only `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((fromDateOnly(to)!.getTime() - fromDateOnly(from)!.getTime()) / DAY_MS);
}

export function addDays(dateOnly: string, days: number): string {
  return toDateOnly(new Date(fromDateOnly(dateOnly)!.getTime() + days * DAY_MS))!;
}

/** Solar date for day/month in `year`, clamping 29/2 (and 31 in short months) to the month's last day. */
export function solarDate(day: number, month: number, year: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}
