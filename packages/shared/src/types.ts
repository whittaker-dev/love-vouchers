import type { OccasionKind, OccasionTheme, VoucherColor } from "./schemas.js";

// Response shapes returned by the API. Dates are ISO strings; date-only fields are "YYYY-MM-DD".

export interface AdminDto {
  id: string;
  email: string;
  name: string;
}

export interface ProfileDto {
  name: string;
  nickname: string | null;
  avatarEmoji: string;
  bio: string | null;
  birthday: string | null;
  anniversary: string | null;
  favorites: string[];
  /** Name of the admin (the boyfriend), shown as "từ <name>" on the public page. */
  partnerName: string;
}

export interface VoucherDto {
  id: string;
  title: string;
  description: string;
  emoji: string;
  value: string | null;
  terms: string | null;
  color: VoucherColor;
  quantity: number | null;
  /** Times picked so far. A stored counter: finished notifications are deleted, so it cannot be counted. */
  used: number;
  /** Uses left; null when the voucher is unlimited. */
  remaining: number | null;
  expiresAt: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

/**
 * One voucher inside a wish that the admin has not handled yet. Items only exist while pending:
 * marking one done (or cancelling it) deletes it, which keeps the database tiny.
 */
export interface RedemptionDto {
  id: string;
  voucherId: string | null;
  /** Snapshot of the voucher at send time, so the notification survives voucher edits/deletes. */
  voucherTitle: string;
  voucherEmoji: string;
}

/** A wish the girlfriend sent = one admin notification. Deleted once its last item is handled. */
export interface WishDto {
  id: string;
  message: string | null;
  createdAt: string;
  items: RedemptionDto[];
}

export interface ApiErrorBody {
  error: string;
  /** Field → message, present for validation errors. */
  fields?: Record<string, string>;
}

/** Who is looking at her pages: she (user) or the admin previewing them. */
export interface ViewerDto {
  role: "user" | "admin";
  email: string;
}

/** What her login page may show before anyone is logged in. */
export interface WelcomeDto {
  /** Her name from the admin's profile page; null only if no profile exists yet. */
  name: string | null;
}

/** Her monthly sending allowance (calendar month, Vietnam time). */
export interface WishQuotaDto {
  /** "2026-10" */
  month: string;
  limit: number;
  used: number;
  remaining: number;
  /** First day of next month, "YYYY-MM-DD". */
  resetsOn: string;
}

export interface SettingsDto {
  monthlyWishLimit: number;
  /** Usage of the current month, for the admin's overview. */
  quota: WishQuotaDto;
}

export interface OccasionDto {
  id: string;
  name: string;
  emoji: string;
  theme: OccasionTheme;
  kind: OccasionKind;
  day: number | null;
  month: number | null;
  daysBefore: number;
  daysAfter: number;
  message: string;
  isEnabled: boolean;
  /** Next solar date it falls on ("YYYY-MM-DD"), or null when unknown (e.g. birthday not set). */
  nextDate: string | null;
  /** Days from today to nextDate (0 = today). */
  daysUntil: number | null;
}

/** The occasion her pages are themed for right now, with the banner text already personalised. */
export interface ActiveOccasionDto {
  id: string;
  name: string;
  emoji: string;
  theme: OccasionTheme;
  message: string;
  /** The day being celebrated ("YYYY-MM-DD"); may differ from today inside the before/after window. */
  date: string;
}

export interface GreetingDto {
  /** Vietnam date the greeting belongs to, "YYYY-MM-DD". Used to remember if today's card was scratched. */
  date: string;
  emoji: string;
  text: string;
}

/** Her login as the admin sees it (never includes the password). */
export interface UserAccountDto {
  email: string;
  createdAt: string;
}
