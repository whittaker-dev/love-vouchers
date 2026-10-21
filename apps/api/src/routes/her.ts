import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { wishInputSchema } from "@love/shared";
import type { ActiveOccasionDto, GreetingDto, ProfileDto, VoucherDto, WishDto, WishQuotaDto } from "@love/shared";
import { requireUser, requireViewer } from "../auth.js";
import { todayInVietnam } from "../dates.js";
import { prisma } from "../db.js";
import { HttpError } from "../errors.js";
import { greetingFor } from "../greetings.js";
import { activeOccasion, previewOccasion } from "../occasions.js";
import { consumeMonthlySend, currentQuota } from "../quota.js";
import { toProfileDto, toVoucherDto, toWishDto, wishItemsInclude } from "../serializers.js";

// The girlfriend's side of the app. Reading needs her login (or the admin, previewing her pages);
// sending a wish needs her login.
export const herRouter = Router();
herRouter.use(requireViewer);

herRouter.get("/profile", async (_req, res) => {
  const [profile, admin] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.admin.findFirst({ orderBy: { createdAt: "asc" } }),
  ]);
  if (!profile) throw new HttpError(404, "Chưa có hồ sơ. Hãy chạy `pnpm db:seed` hoặc vào trang quản trị.");
  res.json(toProfileDto(profile, admin?.name ?? "Anh") satisfies ProfileDto);
});

herRouter.get("/vouchers", async (_req, res) => {
  const vouchers = await prisma.voucher.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: todayInVietnam() } }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json(vouchers.map(toVoucherDto) satisfies VoucherDto[]);
});

herRouter.get("/wishes", async (_req, res) => {
  const wishes = await prisma.wishRequest.findMany({
    include: wishItemsInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(wishes.map(toWishDto) satisfies WishDto[]);
});

herRouter.get("/wishes/quota", async (_req, res) => {
  res.json((await currentQuota()) satisfies WishQuotaDto);
});

herRouter.get("/occasions/active", async (req, res) => {
  // ?preview=<id> lets the admin see any occasion's theme today ("Xem thử").
  const previewId = typeof req.query.preview === "string" ? req.query.preview : null;
  const occasion = previewId && req.adminId ? await previewOccasion(previewId) : await activeOccasion();
  res.json(occasion satisfies ActiveOccasionDto | null);
});

herRouter.get("/greetings/today", (_req, res) => {
  res.json(greetingFor() satisfies GreetingDto);
});

// The monthly quota is the real limit; this only stops a stuck button from hammering the API.
const wishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Em gửi nhiều quá rồi, nghỉ một chút rồi gửi tiếp nhé 💕" },
});

herRouter.post("/wishes", requireUser, wishLimiter, async (req, res) => {
  const input = wishInputSchema.parse(req.body);

  const wish = await prisma.$transaction(async (tx) => {
    // Rolled back with everything else if a voucher below turns out to be unavailable.
    await consumeMonthlySend(tx);
    const vouchers = await tx.voucher.findMany({ where: { id: { in: input.voucherIds } } });
    const today = todayInVietnam();
    for (const id of input.voucherIds) {
      const voucher = vouchers.find((candidate) => candidate.id === id);
      if (!voucher || !voucher.isActive) throw new HttpError(404, "Có voucher không còn nữa, tải lại trang nhé");
      if (voucher.expiresAt && voucher.expiresAt < today) {
        throw new HttpError(409, `“${voucher.title}” đã hết hạn mất rồi`);
      }
      // Check-and-increment in one statement, so two sends at once cannot both take the last use.
      const { count } = await tx.voucher.updateMany({
        where: { id, OR: [{ quantity: null }, { usedCount: { lt: tx.voucher.fields.quantity } }] },
        data: { usedCount: { increment: 1 } },
      });
      if (count === 0) throw new HttpError(409, `“${voucher.title}” đã dùng hết lượt`);
    }

    return tx.wishRequest.create({
      data: {
        message: input.message,
        items: {
          create: input.voucherIds.map((id) => {
            const voucher = vouchers.find((candidate) => candidate.id === id)!;
            return { voucherId: voucher.id, voucherTitle: voucher.title, voucherEmoji: voucher.emoji };
          }),
        },
      },
      include: wishItemsInclude,
    });
  });

  // No email: the wish now shows up as a notification on the admin's "Thông báo" page.
  res.status(201).json(toWishDto(wish) satisfies WishDto);
});
