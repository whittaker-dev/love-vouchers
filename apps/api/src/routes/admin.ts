import { Router } from "express";
import { profileInputSchema, voucherInputSchema } from "@love/shared";
import type { ProfileDto, VoucherDto, WishDto } from "@love/shared";
import { requireAdmin } from "../auth.js";
import { fromDateOnly } from "../dates.js";
import { prisma } from "../db.js";
import { HttpError } from "../errors.js";
import { completeWish, resolveRedemption } from "../notifications.js";
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
