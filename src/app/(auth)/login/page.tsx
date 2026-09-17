import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string; role?: string }> }) {
  const user = await getSession();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  return <LoginForm registered={sp.registered === "1"} initialRole={sp.role === "teacher" ? "teacher" : "student"} />;
}
