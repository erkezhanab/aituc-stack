import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

export type Role = "teacher" | "student";
export type SessionUser = { id: string; name: string; email: string; role: Role };

const COOKIE = "aitu_session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-secret");

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = payload.id as string;
    // re-check the user still exists (and pick up name changes)
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role as Role };
  } catch {
    return null;
  }
}

export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(user.role === "teacher" ? "/teacher" : "/student");
  return user;
}

export function homeFor(role: Role) {
  return role === "teacher" ? "/teacher" : "/student";
}
