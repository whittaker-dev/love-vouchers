import type { ProfileDto, RedemptionDto, VoucherColor, VoucherDto, WishDto } from "@love/shared";
import type { Profile, Redemption, Voucher, WishRequest } from "./generated/prisma/client.js";
import { toDateOnly } from "./dates.js";

export function toVoucherDto(voucher: Voucher): VoucherDto {
  return {
    id: voucher.id,
    title: voucher.title,
    description: voucher.description,
    emoji: voucher.emoji,
    value: voucher.value,
    terms: voucher.terms,
    color: voucher.color as VoucherColor,
    quantity: voucher.quantity,
    used: voucher.usedCount,
    remaining: voucher.quantity === null ? null : Math.max(0, voucher.quantity - voucher.usedCount),
    expiresAt: toDateOnly(voucher.expiresAt),
    isActive: voucher.isActive,
    sortOrder: voucher.sortOrder,
    createdAt: voucher.createdAt.toISOString(),
  };
}

export function toProfileDto(profile: Profile, partnerName: string): ProfileDto {
  return {
    name: profile.name,
    nickname: profile.nickname,
    avatarEmoji: profile.avatarEmoji,
    bio: profile.bio,
    birthday: toDateOnly(profile.birthday),
    anniversary: toDateOnly(profile.anniversary),
    favorites: profile.favorites,
    partnerName,
  };
}

export function toRedemptionDto(redemption: Redemption): RedemptionDto {
  return {
    id: redemption.id,
    voucherId: redemption.voucherId,
    voucherTitle: redemption.voucherTitle,
    voucherEmoji: redemption.voucherEmoji,
  };
}

/** Include this in wish queries; ordering by id just keeps the item order stable between reads. */
export const wishItemsInclude = { items: { orderBy: { id: "asc" as const } } };

export function toWishDto(wish: WishRequest & { items: Redemption[] }): WishDto {
  return {
    id: wish.id,
    message: wish.message,
    createdAt: wish.createdAt.toISOString(),
    items: wish.items.map(toRedemptionDto),
  };
}
