import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { wishInputSchema } from "@love/shared";
import type { ProfileDto, VoucherDto, WishDto } from "@love/shared";
import { todayInVietnam } from "../dates.js";
import { prisma } from "../db.js";
import { HttpError } from "../errors.js";
import { toProfileDto, toVoucherDto, toWishDto, wishItemsInclude } from "../serializers.js";

// Everything here is reachable without logging in: it is the girlfriend's side of the app.
export const publicRouter = Router();

publicRouter.get("/profile", async (_req, res) => {
  const [profile, admin] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.admin.findFirst({ orderBy: { createdAt: "asc" } }),
  ]);
  if (!profile) throw new HttpError(404, "Chưa có hồ sơ. Hãy chạy `pnpm db:seed` hoặc vào trang quản trị.");
  res.json(toProfileDto(profile, admin?.name ?? "Anh") satisfies ProfileDto);
});

publicRouter.get("/vouchers", async (_req, res) => {
  const vouchers = await prisma.voucher.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: todayInVietnam() } }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json(vouchers.map(toVoucherDto) satisfies VoucherDto[]);
});

publicRouter.get("/wishes", async (_req, res) => {
  const wishes = await prisma.wishRequest.findMany({
    include: wishItemsInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(wishes.map(toWishDto) satisfies WishDto[]);
});

// Needs no login and writes to the database, so cap it to stop accidental (or playful) spam.
const wishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { error: "Em gửi nhiều quá rồi, nghỉ một chút rồi gửi tiếp nhé 💕" },
});

publicRouter.post("/wishes", wishLimiter, async (req, res) => {
  const input = wishInputSchema.parse(req.body);

  const wish = await prisma.$transaction(async (tx) => {
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
