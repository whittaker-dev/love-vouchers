import type { ActiveOccasionDto, OccasionDto, OccasionKind, OccasionTheme } from "@love/shared";
import { addDays, daysBetween, solarDate, toDateOnly, todayDateOnlyInVietnam } from "./dates.js";
import { prisma } from "./db.js";
import type { Occasion, Profile } from "./generated/prisma/client.js";
import { lunarToSolar } from "./lunar.js";

// When does each occasion fall, and which one (if any) themes her pages today.

/** The solar date an occasion falls on in a given (solar or lunar) year, or null if unknown. */
function occurrenceIn(occasion: Occasion, year: number, profile: Profile | null): string | null {
  switch (occasion.kind as OccasionKind) {
    case "solar":
      return occasion.day && occasion.month ? solarDate(occasion.day, occasion.month, year) : null;
    case "lunar":
      return occasion.day && occasion.month ? lunarToSolar(occasion.day, occasion.month, year) : null;
    case "birthday":
    case "anniversary": {
      const source = occasion.kind === "birthday" ? profile?.birthday : profile?.anniversary;
      const date = toDateOnly(source ?? null);
      if (!date) return null;
      const [, month, day] = date.split("-").map(Number);
      return solarDate(day!, month!, year);
    }
  }
}

/** Occurrences around `today`: last year's, this year's and next year's (windows can cross New Year). */
function occurrencesAround(occasion: Occasion, today: string, profile: Profile | null): string[] {
  const year = Number(today.slice(0, 4));
  return [year - 1, year, year + 1]
    .map((y) => occurrenceIn(occasion, y, profile))
    .filter((date): date is string => date !== null);
}

export function toOccasionDto(occasion: Occasion, profile: Profile | null, today = todayDateOnlyInVietnam()): OccasionDto {
  const next = occurrencesAround(occasion, today, profile).find((date) => date >= today) ?? null;
  return {
    id: occasion.id,
    name: occasion.name,
    emoji: occasion.emoji,
    theme: occasion.theme as OccasionTheme,
    kind: occasion.kind as OccasionKind,
    day: occasion.day,
    month: occasion.month,
    daysBefore: occasion.daysBefore,
    daysAfter: occasion.daysAfter,
    message: occasion.message,
    isEnabled: occasion.isEnabled,
    nextDate: next,
    daysUntil: next ? daysBetween(today, next) : null,
  };
}

// Her own days beat public holidays when two overlap (e.g. a birthday on Valentine's Day).
const KIND_PRIORITY: Record<OccasionKind, number> = { birthday: 0, anniversary: 1, solar: 2, lunar: 2 };

function toActive(occasion: Occasion, date: string, profile: Profile | null): ActiveOccasionDto {
  const name = profile?.nickname || profile?.name || "em";
  return {
    id: occasion.id,
    name: occasion.name,
    emoji: occasion.emoji,
    theme: occasion.theme as OccasionTheme,
    message: occasion.message.replaceAll("{name}", name),
    date,
  };
}

/**
 * The occasion to theme her pages with today: enabled, with today inside its
 * [date − daysBefore, date + daysAfter] window. Ties go to her own days, then the closest date.
 */
export async function activeOccasion(today = todayDateOnlyInVietnam()): Promise<ActiveOccasionDto | null> {
  const [occasions, profile] = await Promise.all([
    prisma.occasion.findMany({ where: { isEnabled: true } }),
    prisma.profile.findUnique({ where: { id: 1 } }),
  ]);
  const candidates = occasions.flatMap((occasion) =>
    occurrencesAround(occasion, today, profile)
      .filter((date) => today >= addDays(date, -occasion.daysBefore) && today <= addDays(date, occasion.daysAfter))
      .map((date) => ({ occasion, date })),
  );
  candidates.sort(
    (a, b) =>
      KIND_PRIORITY[a.occasion.kind as OccasionKind] - KIND_PRIORITY[b.occasion.kind as OccasionKind] ||
      Math.abs(daysBetween(today, a.date)) - Math.abs(daysBetween(today, b.date)),
  );
  const best = candidates[0];
  return best ? toActive(best.occasion, best.date, profile) : null;
}

/** For the admin's "Xem thử" button: any occasion, as if it were today. */
export async function previewOccasion(id: string): Promise<ActiveOccasionDto | null> {
  const [occasion, profile] = await Promise.all([
    prisma.occasion.findUnique({ where: { id } }),
    prisma.profile.findUnique({ where: { id: 1 } }),
  ]);
  if (!occasion) return null;
  const today = todayDateOnlyInVietnam();
  const date = toOccasionDto(occasion, profile, today).nextDate ?? today;
  return toActive(occasion, date, profile);
}
