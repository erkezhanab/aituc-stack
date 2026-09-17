"use server";

import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, homeFor } from "@/lib/auth";
import { formDataToObject, loginSchema, registerSchema, validate, type FieldErrors } from "@/lib/validation/auth";
import type { Params } from "@/i18n";

/**
 * Messages are i18n keys (see src/i18n/*.json); the client translates them.
 * `error` is a form-level message; `fieldErrors` are shown inline under the named field.
 */
export type ActionState =
  | { error?: string; fieldErrors?: FieldErrors; params?: Params; ok?: undefined }
  | { ok: string; params?: Params; error?: undefined; fieldErrors?: undefined }
  | undefined;

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  // Server-side re-validation: the client check is UX only.
  const v = validate(loginSchema, formDataToObject(formData));
  if (v.errors) return { fieldErrors: v.errors };
  const { role, email, password } = v.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "err.badCredentials" };
  if (user.role !== role) return { error: role === "teacher" ? "err.accountIsStudent" : "err.accountIsTeacher" };

  await createSession({ id: user.id, name: user.name, email: user.email, role });
  redirect(homeFor(role));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

/**
 * Registration with an explicit role. No email confirmation: the account is stored right away
 * and the user then signs in on /login. Students register freely; teachers must provide
 * TEACHER_INVITE_CODE (from .env) — otherwise no teacher account is created.
 */
export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const v = validate(registerSchema, formDataToObject(formData));
  if (v.errors) return { fieldErrors: v.errors };
  const { role, name, email, password, inviteCode } = v.data;

  if (role === "teacher") {
    const expected = process.env.TEACHER_INVITE_CODE?.trim();
    if (!expected || !inviteCode || !safeEqual(inviteCode, expected)) return { fieldErrors: { inviteCode: "err.badInviteCode" } };
  }

  if (await prisma.user.findUnique({ where: { email } })) return { fieldErrors: { email: "err.userExists" } };

  await prisma.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) } });
  redirect(`/login?registered=1&role=${role}`);
}
