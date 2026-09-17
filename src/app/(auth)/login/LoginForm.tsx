"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { useT } from "@/i18n/client";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { RoleSwitch } from "@/components/RoleSwitch";

export function LoginForm({ registered = false, initialRole = "student" }: { registered?: boolean; initialRole?: "student" | "teacher" }) {
  const t = useT();
  const [role, setRole] = useState<"student" | "teacher">(initialRole);
  const [state, action] = useActionState(loginAction, undefined);

  return (
    <div className="card p-6">
      <h2 className="display text-xl font-bold">{t("auth.loginTitle")}</h2>
      {registered && <p className="stripe mt-4 border-l-fg bg-surface-2 px-3 py-1.5 text-[13px]">{t("msg.registered")}</p>}
      <div className="mt-4"><RoleSwitch role={role} onChange={setRole} /></div>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="role" value={role} />
        <div>
          <label className="label">{t("common.email")}</label>
          <input name="email" type="email" required className="input" placeholder={t("auth.emailPlaceholder")} autoComplete="email" />
        </div>
        <div>
          <label className="label">{t("common.password")}</label>
          <input name="password" type="password" required className="input" autoComplete="current-password" />
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full">{t("auth.loginAs", { role: role === "student" ? t("common.studentLower") : t("common.teacherLower") })}</SubmitButton>
      </form>
      <p className="mt-4 border-t border-line pt-3 text-center text-xs text-muted">
        {t("auth.noAccount")} <Link href="/register" className="link">{t("auth.register")}</Link>
      </p>
    </div>
  );
}
