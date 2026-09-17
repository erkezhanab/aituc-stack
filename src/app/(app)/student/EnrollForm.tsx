"use client";
import { useActionState } from "react";
import { enrollAction } from "@/actions/student";
import { useT } from "@/i18n/client";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function EnrollForm() {
  const [state, action] = useActionState(enrollAction, undefined);
  const t = useT();
  return (
    <form action={action} className="space-y-2.5">
      <input name="code" required className="input font-mono uppercase tracking-widest" placeholder={t("student.codePlaceholder")} />
      <FormMessage state={state} />
      <SubmitButton className="btn-accent w-full">{t("student.enrollBtn")}</SubmitButton>
    </form>
  );
}
