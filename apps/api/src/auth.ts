import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { CookieOptions, RequestHandler, Response } from "express";
import { config } from "./config.js";
import { HttpError } from "./errors.js";

const COOKIE_NAME = "lv_session";
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

export function startSession(res: Response, adminId: string): void {
  const token = jwt.sign({ sub: adminId }, config.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

export function endSession(res: Response): void {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
    }
  }
}

/** Rejects with 401 unless the request carries a valid admin session cookie. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[COOKIE_NAME];
  if (typeof token !== "string") throw new HttpError(401, "Vui lòng đăng nhập");
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    if (typeof payload === "string" || typeof payload.sub !== "string") throw new Error("bad payload");
    req.adminId = payload.sub;
  } catch {
    throw new HttpError(401, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
  }
  next();
};
