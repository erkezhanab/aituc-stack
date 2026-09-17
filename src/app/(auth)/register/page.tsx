"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { useT } from "@/i18n/client";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { RoleSwitch } from "@/components/RoleSwitch";

export default function RegisterPage() {
  const t = useT();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [state, action] = useActionState(registerAction, undefined);
  return (
    <div className="card p-6">
      <h2 className="display text-xl font-bold">{t("auth.registerTitle")}</h2>
      <div className="mt-4">
        <p className="label">{t("auth.roleQuestion")}</p>
        <RoleSwitch role={role} onChange={setRole} hints />
      </div>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="role" value={role} />
        <div><label className="label">{t("common.name")}</label><input name="name" required className="input" autoComplete="name" /></div>
        <div><label className="label">{t("common.email")}</label><input name="email" type="email" required className="input" placeholder={t("auth.emailPlaceholder")} autoComplete="email" /></div>
        <div><label className="label">{t("common.password")}</label><input name="password" type="password" minLength={6} required className="input" autoComplete="new-password" /></div>
        {role === "teacher" && (
          <div className="stripe border-l-fg bg-surface-2 p-3">
            <label className="label">{t("auth.inviteCode")}</label>
            <input name="inviteCode" required className="input font-mono tracking-wider" placeholder="AITU-XXXX-XXXX" autoComplete="off" />
            <p className="mt-1.5 text-[11px] text-muted">{t("auth.inviteCodeHint")}</p>
          </div>
        )}
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full">{t("auth.createAccount")}</SubmitButton>
      </form>
      <p className="mt-4 border-t border-line pt-3 text-center text-xs text-muted">
        {t("auth.haveAccount")} <Link href="/login" className="link">{t("auth.login")}</Link>
      </p>
    </div>
  );
}
