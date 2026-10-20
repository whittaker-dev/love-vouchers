import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import type { ApiErrorBody } from "@love/shared";

/** Throw from a route to send `status` with a user-facing (Vietnamese) message. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Không tìm thấy" } satisfies ApiErrorBody);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".");
      fields[key] ??= issue.message;
    }
    res.status(400).json({ error: "Dữ liệu chưa hợp lệ", fields } satisfies ApiErrorBody);
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message } satisfies ApiErrorBody);
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Có lỗi xảy ra, thử lại sau nhé" } satisfies ApiErrorBody);
};
