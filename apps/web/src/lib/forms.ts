import type { z } from "zod";
import { ApiError } from "../api/client";

export type FieldErrors = Record<string, string>;

/**
 * Validates with the same schema the API uses, so most mistakes are caught before a request.
 * Returns the parsed output or the first message per field.
 */
export function validate<Schema extends z.ZodType>(
  schema: Schema,
  data: z.input<Schema>,
): { ok: true; data: z.output<Schema> } | { ok: false; errors: FieldErrors } {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join(".")] ??= issue.message;
  }
  return { ok: false, errors };
}

/** Field errors returned by the API for a failed mutation, if any. */
export function apiFieldErrors(error: unknown): FieldErrors {
  return error instanceof ApiError ? error.fields : {};
}

/** Request-level message for errors that are not tied to a single field. */
export function apiFormError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError && Object.keys(error.fields).length > 0) return null;
  return error instanceof Error ? error.message : "Có lỗi xảy ra";
}
