import type { VoucherColor } from "./schemas.js";

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
