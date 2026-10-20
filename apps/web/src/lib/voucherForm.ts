import type { VoucherDto, VoucherInput } from "@love/shared";

/** API payload for a voucher that already exists, e.g. to flip `isActive` from the list. */
export function voucherToInput(voucher: VoucherDto): VoucherInput {
  return {
    title: voucher.title,
    description: voucher.description,
    emoji: voucher.emoji,
    value: voucher.value,
    terms: voucher.terms,
    color: voucher.color,
    quantity: voucher.quantity,
    expiresAt: voucher.expiresAt,
    isActive: voucher.isActive,
    sortOrder: voucher.sortOrder,
  };
}
