"use client";
import { useActionState } from "react";
import { gradeAction } from "@/actions/teacher";
import { useT } from "@/i18n/client";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

export function GradeForm({ submissionId, score, comment }: { submissionId: string; score?: number; comment?: string | null }) {
  const [state, action] = useActionState(gradeAction, undefined);
  const t = useT();
  return (
    <form action={action} className="space-y-2 border-t border-line pt-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-24">
          <label className="label">{t("grade.score")}</label>
          <input name="score" type="number" min={1} max={12} step={1} defaultValue={score} required className="input display text-center text-base font-bold" />
        </div>
        <div className="min-w-48 flex-1">
          <label className="label">{t("grade.comment")}</label>
          <input name="comment" defaultValue={comment ?? ""} className="input" placeholder={t("common.optional")} />
        </div>
        <SubmitButton className={score ? "btn-secondary" : "btn-primary"}>{score ? t("grade.update") : t("grade.set")}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
