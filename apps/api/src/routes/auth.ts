import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { changePasswordSchema, loginSchema } from "@love/shared";
import type { AdminDto } from "@love/shared";
import { endSession, hashPassword, requireAdmin, startSession, verifyPassword } from "../auth.js";
import { prisma } from "../db.js";
import { HttpError } from "../errors.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Đăng nhập sai quá nhiều lần, thử lại sau 15 phút" },
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { email } });
  // Same message for unknown email and wrong password, so the form does not reveal which emails exist.
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    throw new HttpError(401, "Email hoặc mật khẩu không đúng");
  }
  startSession(res, admin.id);
  res.json({ id: admin.id, email: admin.email, name: admin.name } satisfies AdminDto);
});

authRouter.post("/logout", (_req, res) => {
  endSession(res);
  res.status(204).end();
});

authRouter.get("/me", requireAdmin, async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
  if (!admin) throw new HttpError(401, "Vui lòng đăng nhập");
  res.json({ id: admin.id, email: admin.email, name: admin.name } satisfies AdminDto);
});

authRouter.put("/password", requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
  if (!admin || !(await verifyPassword(currentPassword, admin.passwordHash))) {
    throw new HttpError(400, "Mật khẩu hiện tại không đúng");
  }
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  res.status(204).end();
});
