"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { loginSchema } from "@/lib/validation/auth";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useT } from "@/i18n/client";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { RoleSwitch } from "@/components/RoleSwitch";
import { Field, PasswordField } from "@/components/Field";

export function LoginForm({ registered = false, initialRole = "student" }: { registered?: boolean; initialRole?: "student" | "teacher" }) {
  const t = useT();
  const [role, setRole] = useState<"student" | "teacher">(initialRole);
  const [state, action] = useActionState(loginAction, undefined);
  const { formProps, errorFor, draftFor } = useFormValidation(loginSchema, state?.fieldErrors);

  return (
    <div className="card p-6">
      <h2 className="display text-xl font-bold">{t("auth.loginTitle")}</h2>
      {registered && <p className="stripe mt-4 border-l-fg bg-surface-2 px-3 py-1.5 text-[13px]">{t("msg.registered")}</p>}
      <div className="mt-4"><RoleSwitch role={role} onChange={setRole} /></div>
      <form action={action} {...formProps} className="mt-4 space-y-3">
        <input type="hidden" name="role" value={role} />
        <Field name="email" type="email" {...draftFor("email")} label={t("common.email")} error={errorFor("email")} placeholder={t("auth.emailPlaceholder")} autoComplete="email" />
        <PasswordField name="password" label={t("common.password")} error={errorFor("password")} autoComplete="current-password" />
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full">{t("auth.loginAs", { role: role === "student" ? t("common.studentLower") : t("common.teacherLower") })}</SubmitButton>
      </form>
      <p className="mt-4 border-t border-line pt-3 text-center text-xs text-muted">
        {t("auth.noAccount")} <Link href="/register" className="link">{t("auth.register")}</Link>
      </p>
    </div>
  );
}
