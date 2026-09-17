"use client";
import { useActionState } from "react";
import { submitAction } from "@/actions/student";
import { useT } from "@/i18n/client";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function SubmitForm({ assignmentId }: { assignmentId: string }) {
  const [state, action] = useActionState(submitAction, undefined);
  const t = useT();
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <label className="label">{t("assignment.fileLabel")}</label>
      <div className="flex gap-2">
        <input name="file" type="file" required
          className="input h-auto py-1 file:mr-3 file:h-6 file:rounded-[3px] file:border file:border-line-2 file:bg-surface-2 file:px-2 file:text-[11px] file:font-medium file:text-fg"
          accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx" />
        <SubmitButton className="btn-accent shrink-0">{t("assignment.submitBtn")}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
