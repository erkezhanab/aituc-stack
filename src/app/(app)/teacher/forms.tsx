"use client";
import { useActionState } from "react";
import { createAssignmentAction, createSubjectAction } from "@/actions/teacher";
import { useT } from "@/i18n/client";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { DeadlinePicker } from "@/components/DeadlinePicker";

const fileCls = "input h-auto py-1 file:mr-3 file:h-6 file:rounded-[3px] file:border file:border-line-2 file:bg-surface-2 file:px-2 file:text-[11px] file:font-medium file:text-fg";

export function CreateSubjectForm() {
  const [state, action] = useActionState(createSubjectAction, undefined);
  const t = useT();
  return (
    <form action={action} className="space-y-2.5">
      <div><label className="label">{t("teacher.title")}</label><input name="title" required className="input" placeholder={t("teacher.subjectPlaceholder")} /></div>
      <FormMessage state={state} />
      <SubmitButton className="btn-secondary w-full">{t("teacher.createSubject")}</SubmitButton>
    </form>
  );
}

export function CreateAssignmentForm({ subjects, fixedSubjectId }: { subjects: { id: string; title: string }[]; fixedSubjectId?: string }) {
  const [state, action] = useActionState(createAssignmentAction, undefined);
  const t = useT();
  return (
    <form action={action} className="space-y-2.5">
      {fixedSubjectId ? (
        <input type="hidden" name="subjectId" value={fixedSubjectId} />
      ) : (
        <div>
          <label className="label">{t("common.subject")}</label>
          <select name="subjectId" required className="input">
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
      )}
      <div><label className="label">{t("teacher.title")}</label><input name="title" required className="input" /></div>
      <div><label className="label">{t("teacher.description")}</label><textarea name="description" rows={3} className="input" /></div>
      <DeadlinePicker />
      <div>
        <label className="label">{t("teacher.assignmentFile")} · {t("teacher.pdfOnly")}</label>
        <input name="file" type="file" accept="application/pdf,.pdf" required className={fileCls} />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-accent w-full">{t("teacher.createAssignment")}</SubmitButton>
    </form>
  );
}
