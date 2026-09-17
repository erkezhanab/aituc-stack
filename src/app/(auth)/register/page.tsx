"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { NAME_MAX, PASSWORD_MAX, registerSchema } from "@/lib/validation/auth";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useT } from "@/i18n/client";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { RoleSwitch } from "@/components/RoleSwitch";
import { Field, PasswordField } from "@/components/Field";

export default function RegisterPage() {
  const t = useT();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [state, action] = useActionState(registerAction, undefined);
  const { formProps, errorFor, draftFor } = useFormValidation(registerSchema, state?.fieldErrors);
  return (
    <div className="card p-6">
      <h2 className="display text-xl font-bold">{t("auth.registerTitle")}</h2>
      <div className="mt-4">
        <p className="label">{t("auth.roleQuestion")}</p>
        <RoleSwitch role={role} onChange={setRole} hints />
      </div>
      <form action={action} {...formProps} className="mt-4 space-y-3">
        <input type="hidden" name="role" value={role} />
        <Field name="name" {...draftFor("name")} label={t("common.name")} error={errorFor("name")} maxLength={NAME_MAX} autoComplete="name" />
        <Field name="email" type="email" {...draftFor("email")} label={t("common.email")} error={errorFor("email")} placeholder={t("auth.emailPlaceholder")} autoComplete="email" />
        <PasswordField name="password" label={t("common.password")} error={errorFor("password")} hint={t("auth.passwordHint")} maxLength={PASSWORD_MAX} autoComplete="new-password" />
        <PasswordField name="confirmPassword" label={t("common.confirmPassword")} error={errorFor("confirmPassword")} maxLength={PASSWORD_MAX} autoComplete="new-password" />
        {role === "teacher" && (
          <div className="stripe border-l-fg bg-surface-2 p-3">
            <Field name="inviteCode" label={t("auth.inviteCode")} error={errorFor("inviteCode")} hint={t("auth.inviteCodeHint")}
              className="font-mono tracking-wider" placeholder="AITU-XXXX-XXXX" autoComplete="off" />
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
