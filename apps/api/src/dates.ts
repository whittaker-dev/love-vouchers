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
