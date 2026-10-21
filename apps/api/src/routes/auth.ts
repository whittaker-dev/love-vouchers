import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { changePasswordSchema, loginSchema } from "@love/shared";
import type { AdminDto, ViewerDto, WelcomeDto } from "@love/shared";
import {
  endSession,
  hashPassword,
  requireAdmin,
  requireViewer,
  startSession,
  verifyPassword,
} from "../auth.js";
import { prisma } from "../db.js";
import { HttpError } from "../errors.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Đăng nhập sai quá nhiều lần, thử lại sau 15 phút" },
});

// Same message for unknown email and wrong password, so the forms do not reveal which emails exist.
const WRONG_CREDENTIALS = "Email hoặc mật khẩu không đúng";

// ── Admin (the boyfriend) ───────────────────────────────────────────────

authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) throw new HttpError(401, WRONG_CREDENTIALS);
  startSession(res, "admin", admin.id);
  res.json({ id: admin.id, email: admin.email, name: admin.name } satisfies AdminDto);
});

authRouter.post("/logout", (_req, res) => {
  endSession(res, "admin");
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
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(newPassword) } });
  res.status(204).end();
});

// ── Her (the user) ──────────────────────────────────────────────────────

authRouter.post("/user/login", loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw new HttpError(401, WRONG_CREDENTIALS);
  startSession(res, "user", user.id);
  res.json({ role: "user", email: user.email } satisfies ViewerDto);
});

// Public on purpose: her login page greets her by name before she has a session. Only the name leaves.
authRouter.get("/user/welcome", async (_req, res) => {
  const profile = await prisma.profile.findUnique({ where: { id: 1 }, select: { name: true } });
  res.json({ name: profile?.name ?? null } satisfies WelcomeDto);
});

authRouter.post("/user/logout", (_req, res) => {
  endSession(res, "user");
  res.status(204).end();
});

/** Who may view her pages right now. She wins over an admin session in the same browser. */
authRouter.get("/viewer", requireViewer, async (req, res) => {
  if (req.userId) {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user) {
      res.json({ role: "user", email: user.email } satisfies ViewerDto);
      return;
    }
  }
  const admin = req.adminId ? await prisma.admin.findUnique({ where: { id: req.adminId } }) : null;
  if (!admin) throw new HttpError(401, "Em đăng nhập để xem nha");
  res.json({ role: "admin", email: admin.email } satisfies ViewerDto);
});
