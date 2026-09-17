"use client";
import { useT } from "@/i18n/client";

export function RoleSwitch({ role, onChange, hints }: { role: "student" | "teacher"; onChange: (r: "student" | "teacher") => void; hints?: boolean }) {
  const t = useT();
  const opt = (r: "student" | "teacher", label: string, hint: string) => {
    const on = role === r;
    return (
      <button type="button" onClick={() => onChange(r)} role="radio" aria-checked={on}
        className={`flex flex-1 items-start gap-2.5 rounded-[var(--radius-input)] border p-2.5 text-left transition-colors ${on ? "border-fg bg-surface-2" : "border-line-2 bg-surface hover:bg-surface-2"}`}>
        <span className={`mt-1 h-3 w-3 shrink-0 rounded-full border-[3.5px] ${on ? "border-fg" : "border-line-2"}`} />
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold">{label}</span>
          {hints && <span className="block text-xs leading-snug text-muted">{hint}</span>}
        </span>
      </button>
    );
  };
  return (
    <div className="flex flex-col gap-2 sm:flex-row" role="radiogroup" aria-label={t("auth.roleQuestion")}>
      {opt("student", t("auth.iAmStudent"), t("auth.studentRoleHint"))}
      {opt("teacher", t("auth.iAmTeacher"), t("auth.teacherRoleHint"))}
    </div>
  );
}
