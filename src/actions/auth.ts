"use server";

import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, homeFor, type Role } from "@/lib/auth";
import type { Params } from "@/i18n";

/** Messages are i18n keys (see src/i18n/*.json); the client translates them. */
export type ActionState =
  | { error: string; params?: Params; ok?: undefined }
  | { ok: string; params?: Params; error?: undefined }
  | undefined;

const emailSchema = z.string().trim().toLowerCase().email("err.invalidEmail");
const passwordSchema = z.string().min(6, "err.passwordMin");
const nameSchema = z.string().trim().min(2, "err.nameRequired");

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = formData.get("role") as Role;
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success) return { error: email.error.issues[0].message };
  if (role !== "teacher" && role !== "student") return { error: "err.chooseRole" };

  const user = await prisma.user.findUnique({ where: { email: email.data } });
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
  const role = formData.get("role");
  if (role !== "teacher" && role !== "student") return { error: "err.chooseRole" };

  const parsed = z
    .object({ name: nameSchema, email: emailSchema, password: passwordSchema })
    .safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  if (role === "teacher") {
    const expected = process.env.TEACHER_INVITE_CODE?.trim();
    const given = String(formData.get("inviteCode") ?? "").trim();
    if (!expected || !given || !safeEqual(given, expected)) return { error: "err.badInviteCode" };
  }

  if (await prisma.user.findUnique({ where: { email } })) return { error: "err.userExists" };

  await prisma.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) } });
  redirect(`/login?registered=1&role=${role}`);
}
