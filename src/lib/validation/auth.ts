import { z } from "zod";

/**
 * Shared auth validation. Used by the client forms (inline errors before submit) and re-run
 * by the server actions — the server never trusts the client check.
 * Messages are i18n keys (see src/i18n/*.json).
 */

export const PASSWORD_MIN = 8;
/** bcrypt silently truncates input beyond 72 bytes. */
export const PASSWORD_MAX = 72;
export const NAME_MIN = 2;
export const NAME_MAX = 50;

// local@domain.tld — no whitespace, at least one dot in the domain.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_LETTER = /\p{L}/u;
const HAS_DIGIT = /\d/;

export const emailSchema = z
  .string({ error: "err.emailRequired" })
  .trim()
  .min(1, "err.emailRequired")
  .regex(EMAIL_RE, "err.invalidEmail")
  .toLowerCase();

/** New password: length + at least one letter and one digit. */
export const newPasswordSchema = z
  .string({ error: "err.passwordRequired" })
  .min(1, "err.passwordRequired")
  .min(PASSWORD_MIN, "err.passwordMin")
  .max(PASSWORD_MAX, "err.passwordMax")
  .regex(HAS_LETTER, "err.passwordLetter")
  .regex(HAS_DIGIT, "err.passwordDigit");

export const nameSchema = z
  .string({ error: "err.nameRequired" })
  .trim()
  .min(1, "err.nameRequired")
  .min(NAME_MIN, "err.nameMin")
  .max(NAME_MAX, "err.nameMax")
  .regex(HAS_LETTER, "err.nameLetters");

export const roleSchema = z.enum(["student", "teacher"], { error: "err.chooseRole" });

/** Sign-in: only the format matters — it is an existing password, no strength rules. */
export const loginSchema = z.object({
  role: roleSchema,
  email: emailSchema,
  password: z.string({ error: "err.passwordRequired" }).min(1, "err.passwordRequired"),
});

export const registerSchema = z
  .object({
    role: roleSchema,
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string({ error: "err.confirmRequired" }).min(1, "err.confirmRequired"),
    inviteCode: z.string().trim().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "err.passwordsMismatch", path: ["confirmPassword"] })
  .refine((v) => v.role !== "teacher" || !!v.inviteCode, { message: "err.inviteRequired", path: ["inviteCode"] });

export type LoginInput = z.input<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;

export type FieldErrors = Record<string, string>;

/** First message per field, keyed by the top-level field name. */
export function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Validate a plain object; returns either the parsed data or per-field errors. */
export function validate<S extends z.ZodType>(schema: S, data: unknown): { data: z.output<S>; errors?: undefined } | { data?: undefined; errors: FieldErrors } {
  const r = schema.safeParse(data);
  return r.success ? { data: r.data } : { errors: fieldErrorsOf(r.error) };
}

export function formDataToObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  fd.forEach((v, k) => { if (typeof v === "string") o[k] = v; });
  return o;
}
