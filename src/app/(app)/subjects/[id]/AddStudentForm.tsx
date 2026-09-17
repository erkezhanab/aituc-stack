"use client";
import { useActionState } from "react";
import { addStudentAction } from "@/actions/teacher";
import { useT } from "@/i18n/client";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function AddStudentForm({ subjectId }: { subjectId: string }) {
  const [state, action] = useActionState(addStudentAction, undefined);
  const t = useT();
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="subjectId" value={subjectId} />
      <div className="flex gap-2">
        <input name="email" type="email" required className="input" placeholder={t("teacher.studentEmail")} />
        <SubmitButton className="btn-primary shrink-0">{t("teacher.addStudent")}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
