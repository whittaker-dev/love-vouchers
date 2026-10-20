import { z } from "zod";

/** Card tints, all in the pink family. Keys map to --card-<key> tokens in apps/web/src/styles/tokens.css. */
export const VOUCHER_COLORS = ["blush", "cream", "mauve", "peach", "lilac"] as const;
export type VoucherColor = (typeof VOUCHER_COLORS)[number];


/** Calendar date without time, e.g. "2024-02-14". Kept as a string so time zones never shift the day. */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ (định dạng YYYY-MM-DD)");

/** Empty strings from form inputs mean "not set". */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} tối đa ${max} ký tự`)
    .transform((value) => (value === "" ? null : value))
    .nullable();

const emoji = z.string().trim().min(1, "Chọn một emoji").max(16, "Chỉ chọn một emoji thôi");

export const loginSchema = z.object({
  email: z.email("Email không hợp lệ").trim().toLowerCase(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
export type LoginInput = z.input<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới cần ít nhất 8 ký tự").max(128),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu cũ",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

export const voucherInputSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tên voucher").max(80, "Tên voucher tối đa 80 ký tự"),
  description: z.string().trim().min(1, "Vui lòng nhập mô tả").max(500, "Mô tả tối đa 500 ký tự"),
  emoji,
  value: optionalText(60, "Giá trị"),
  terms: optionalText(300, "Điều kiện"),
  color: z.enum(VOUCHER_COLORS, { error: "Chọn một màu" }),
  /** null = unlimited uses. */
  quantity: z
    .number({ error: "Số lượt phải là số" })
    .int("Số lượt phải là số nguyên")
    .min(1, "Số lượt tối thiểu là 1")
    .max(999, "Số lượt tối đa là 999")
    .nullable(),
  expiresAt: dateOnly.nullable(),
  isActive: z.boolean(),
  sortOrder: z.number({ error: "Thứ tự phải là số" }).int().min(0).max(9999),
});
export type VoucherInput = z.input<typeof voucherInputSchema>;

export const profileInputSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(60, "Tên tối đa 60 ký tự"),
  nickname: optionalText(40, "Biệt danh"),
  avatarEmoji: emoji,
  bio: optionalText(500, "Lời giới thiệu"),
  birthday: dateOnly.nullable(),
  anniversary: dateOnly.nullable(),
  favorites: z
    .array(z.string().trim().min(1).max(40, "Mỗi sở thích tối đa 40 ký tự"))
    .max(12, "Tối đa 12 sở thích"),
});
export type ProfileInput = z.input<typeof profileInputSchema>;

/** One "wish list" sent by the girlfriend: several vouchers plus an optional note, one email. */
export const wishInputSchema = z.object({
  voucherIds: z
    .array(z.string().min(1, "Voucher không hợp lệ"))
    .min(1, "Chọn ít nhất một voucher nha")
    .max(20, "Tối đa 20 voucher mỗi lần")
    .refine((ids) => new Set(ids).size === ids.length, { message: "Voucher bị trùng" }),
  message: optionalText(1000, "Lời nhắn"),
});
export type WishInput = z.input<typeof wishInputSchema>;
