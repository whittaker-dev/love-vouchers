import { Router } from "express";
import {
  occasionInputSchema,
  profileInputSchema,
  settingsInputSchema,
  userCreateSchema,
  voucherInputSchema,
} from "@love/shared";
import type { OccasionDto, ProfileDto, SettingsDto, UserAccountDto, VoucherDto, WishDto } from "@love/shared";
import { hashPassword, requireAdmin } from "../auth.js";
import { fromDateOnly } from "../dates.js";
import { prisma } from "../db.js";
import { HttpError } from "../errors.js";
import { completeWish, resolveRedemption } from "../notifications.js";
import { toOccasionDto } from "../occasions.js";
import { currentQuota } from "../quota.js";
import { toProfileDto, toVoucherDto, toWishDto, wishItemsInclude } from "../serializers.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

// ── Vouchers ────────────────────────────────────────────────────────────

adminRouter.get("/vouchers", async (_req, res) => {
  const vouchers = await prisma.voucher.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  res.json(vouchers.map(toVoucherDto) satisfies VoucherDto[]);
});

adminRouter.get("/vouchers/:id", async (req, res) => {
  const voucher = await prisma.voucher.findUnique({ where: { id: req.params.id } });
  if (!voucher) throw new HttpError(404, "Không tìm thấy voucher");
  res.json(toVoucherDto(voucher) satisfies VoucherDto);
});

adminRouter.post("/vouchers", async (req, res) => {
  const input = voucherInputSchema.parse(req.body);
  const voucher = await prisma.voucher.create({
    data: { ...input, expiresAt: fromDateOnly(input.expiresAt) },
  });
  res.status(201).json(toVoucherDto(voucher) satisfies VoucherDto);
});

adminRouter.put("/vouchers/:id", async (req, res) => {
  const input = voucherInputSchema.parse(req.body);
  await assertVoucherExists(req.params.id);
  const voucher = await prisma.voucher.update({
    where: { id: req.params.id },
    data: { ...input, expiresAt: fromDateOnly(input.expiresAt) },
  });
  res.json(toVoucherDto(voucher) satisfies VoucherDto);
});

adminRouter.delete("/vouchers/:id", async (req, res) => {
  await assertVoucherExists(req.params.id);
  // Pending notifications keep their title/emoji snapshot; their voucherId becomes null.
  await prisma.voucher.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

async function assertVoucherExists(id: string): Promise<void> {
  const exists = await prisma.voucher.count({ where: { id } });
  if (!exists) throw new HttpError(404, "Không tìm thấy voucher");
}

// ── Girlfriend profile ──────────────────────────────────────────────────

adminRouter.put("/profile", async (req, res) => {
  const input = profileInputSchema.parse(req.body);
  const data = {
    ...input,
    birthday: fromDateOnly(input.birthday),
    anniversary: fromDateOnly(input.anniversary),
  };
  const [profile, admin] = await Promise.all([
    prisma.profile.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data }),
    prisma.admin.findUnique({ where: { id: req.adminId } }),
  ]);
  res.json(toProfileDto(profile, admin?.name ?? "Anh") satisfies ProfileDto);
});

// ── Notifications (wishes still waiting) ────────────────────────────────

adminRouter.get("/wishes", async (_req, res) => {
  const wishes = await prisma.wishRequest.findMany({
    include: wishItemsInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(wishes.map(toWishDto) satisfies WishDto[]);
});

// Handling a notification deletes it (see notifications.ts).
adminRouter.post("/wishes/:id/complete", async (req, res) => {
  await completeWish(req.params.id);
  res.status(204).end();
});

adminRouter.post("/redemptions/:id/complete", async (req, res) => {
  await resolveRedemption(req.params.id, "done");
  res.status(204).end();
});

adminRouter.post("/redemptions/:id/cancel", async (req, res) => {
  await resolveRedemption(req.params.id, "cancel");
  res.status(204).end();
});

// ── Occasions (themed days) ─────────────────────────────────────────────

/** Birthday/anniversary take their date from the profile, so stored day/month are cleared. */
function occasionData(input: ReturnType<typeof occasionInputSchema.parse>) {
  const ownDate = input.kind === "solar" || input.kind === "lunar";
  return { ...input, day: ownDate ? input.day : null, month: ownDate ? input.month : null };
}

adminRouter.get("/occasions", async (_req, res) => {
  const [occasions, profile] = await Promise.all([
    prisma.occasion.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.profile.findUnique({ where: { id: 1 } }),
  ]);
  const dtos = occasions.map((occasion) => toOccasionDto(occasion, profile));
  // Soonest first; occasions without a known date (e.g. birthday not set yet) last.
  dtos.sort((a, b) => (a.daysUntil ?? Infinity) - (b.daysUntil ?? Infinity));
  res.json(dtos satisfies OccasionDto[]);
});

adminRouter.post("/occasions", async (req, res) => {
  const input = occasionInputSchema.parse(req.body);
  const [occasion, profile] = await Promise.all([
    prisma.occasion.create({ data: occasionData(input) }),
    prisma.profile.findUnique({ where: { id: 1 } }),
  ]);
  res.status(201).json(toOccasionDto(occasion, profile) satisfies OccasionDto);
});

adminRouter.put("/occasions/:id", async (req, res) => {
  const input = occasionInputSchema.parse(req.body);
  if (!(await prisma.occasion.count({ where: { id: req.params.id } }))) throw new HttpError(404, "Không tìm thấy dịp này");
  const [occasion, profile] = await Promise.all([
    prisma.occasion.update({ where: { id: req.params.id }, data: occasionData(input) }),
    prisma.profile.findUnique({ where: { id: 1 } }),
  ]);
  res.json(toOccasionDto(occasion, profile) satisfies OccasionDto);
});

adminRouter.delete("/occasions/:id", async (req, res) => {
  const { count } = await prisma.occasion.deleteMany({ where: { id: req.params.id } });
  if (count === 0) throw new HttpError(404, "Không tìm thấy dịp này");
  res.status(204).end();
});

// ── Settings ────────────────────────────────────────────────────────────

adminRouter.get("/settings", async (_req, res) => {
  const [settings, quota] = await Promise.all([prisma.appSetting.findUnique({ where: { id: 1 } }), currentQuota()]);
  res.json({ monthlyWishLimit: settings?.monthlyWishLimit ?? 3, quota } satisfies SettingsDto);
});

adminRouter.put("/settings", async (req, res) => {
  const input = settingsInputSchema.parse(req.body);
  await prisma.appSetting.upsert({ where: { id: 1 }, create: { id: 1, ...input }, update: input });
  res.json({ monthlyWishLimit: input.monthlyWishLimit, quota: await currentQuota() } satisfies SettingsDto);
});

// ── Her login (one only, created here, never from env) ──────────────────

adminRouter.get("/user", async (_req, res) => {
  const user = await prisma.user.findFirst();
  res.json((user ? { email: user.email, createdAt: user.createdAt.toISOString() } : null) satisfies UserAccountDto | null);
});

/** Only while none exists: to change her login, the admin deletes it and creates a new one. */
adminRouter.post("/user", async (req, res) => {
  const { email, password } = userCreateSchema.parse(req.body);
  if (await prisma.user.count()) throw new HttpError(409, "Đã có tài khoản cho em rồi. Xoá tài khoản cũ trước khi tạo mới");
  const user = await prisma.user.create({ data: { email, passwordHash: await hashPassword(password) } });
  res.status(201).json({ email: user.email, createdAt: user.createdAt.toISOString() } satisfies UserAccountDto);
});

/** Her open sessions stop working at once: requireUser/requireViewer check the account still exists. */
adminRouter.delete("/user", async (_req, res) => {
  const { count } = await prisma.user.deleteMany();
  if (count === 0) throw new HttpError(404, "Chưa có tài khoản nào để xoá");
  res.status(204).end();
});
