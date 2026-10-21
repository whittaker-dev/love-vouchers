import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { CookieOptions, Request, RequestHandler, Response } from "express";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { HttpError } from "./errors.js";

// Two kinds of session, each in its own cookie so the boyfriend can be logged in as admin and
// preview her pages in the same browser. The role is also signed into the token, so a cookie
// copied into the other name is rejected.
export type Role = "admin" | "user";

const COOKIE_NAMES: Record<Role, string> = { admin: "lv_session", user: "lv_user" };
const SESSION_DAYS = 30;

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.COOKIE_SECURE,
  path: "/",
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function startSession(res: Response, role: Role, id: string): void {
  const token = jwt.sign({ sub: id, role }, config.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie(COOKIE_NAMES[role], token, { ...cookieOptions, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

export function endSession(res: Response, role: Role): void {
  res.clearCookie(COOKIE_NAMES[role], cookieOptions);
}

/** The account id of a valid session of `role`, or null (missing, expired, tampered, wrong role). */
function sessionId(req: Request, role: Role): string | null {
  const token: unknown = req.cookies?.[COOKIE_NAMES[role]];
  if (typeof token !== "string") return null;
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (typeof payload === "string" || typeof payload.sub !== "string" || payload.role !== role) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
      userId?: string;
    }
  }
}

/** Admin pages and admin API. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  const adminId = sessionId(req, "admin");
  if (!adminId) throw new HttpError(401, "Vui lòng đăng nhập");
  req.adminId = adminId;
  next();
};

/**
 * Her session, but only while the account still exists: when the admin deletes her login (to
 * create a new one), cookies issued for the old account stop working immediately.
 */
async function liveUserId(req: Request): Promise<string | null> {
  const userId = sessionId(req, "user");
  if (!userId) return null;
  return (await prisma.user.count({ where: { id: userId } })) ? userId : null;
}

/** Actions only she can take (sending a wish). */
export const requireUser: RequestHandler = async (req, _res, next) => {
  const userId = await liveUserId(req);
  if (!userId) throw new HttpError(401, "Em đăng nhập lại nha");
  req.userId = userId;
  next();
};

/** Reading her pages: she, or the admin previewing them. */
export const requireViewer: RequestHandler = async (req, _res, next) => {
  const userId = await liveUserId(req);
  const adminId = sessionId(req, "admin");
  if (!userId && !adminId) throw new HttpError(401, "Em đăng nhập để xem nha");
  if (userId) req.userId = userId;
  if (adminId) req.adminId = adminId;
  next();
};
