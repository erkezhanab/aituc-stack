import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { getT } from "@/i18n/server";
import { ScoreBadge, StatusBadge } from "@/components/StatusBadge";

export default async function StudentGrades() {
  const me = await requireUser("student");
  const { t, locale } = await getT();
  const subs = await prisma.submission.findMany({
    where: { studentId: me.id },
    include: { grade: true, assignment: { include: { subject: true } } },
    orderBy: { submittedAt: "desc" },
  });
  const graded = subs.filter((s) => s.grade);
  const avg = graded.length ? graded.reduce((a, s) => a + s.grade!.score, 0) / graded.length : null;
  const bySubject = new Map<string, { title: string; scores: number[] }>();
  for (const s of graded) {
    const r = bySubject.get(s.assignment.subjectId) ?? { title: s.assignment.subject.title, scores: [] };
    r.scores.push(s.grade!.score);
    bySubject.set(s.assignment.subjectId, r);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="space-y-4">
        <div className="border-b border-line pb-3">
          <p className="eyebrow">{t("common.student")}</p>
          <h1 className="h1">{t("student.myGrades")}</h1>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
          <div className="bg-surface p-4"><p className="label">{t("student.avgScore")}</p><p className="stat-value">{avg?.toFixed(2) ?? "—"}<span className="text-sm font-medium text-muted"> /12</span></p></div>
          <div className="bg-surface p-4"><p className="label">{t("student.submittedCount")}</p><p className="stat-value">{subs.length}</p></div>
          <div className="bg-surface p-4"><p className="label">{t("student.onTimeCount")}</p><p className="stat-value">{subs.filter((s) => s.status === "on_time").length}</p></div>
        </div>
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>{t("common.subject")}</th><th>{t("common.assignments")}</th><th>{t("common.submittedAt")}</th><th>{t("common.status")}</th><th>{t("common.grade")}</th><th>{t("common.comment")}</th></tr></thead>
            <tbody>
              {subs.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted">{t("student.noSubmissions")}</td></tr>}
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="text-muted">{s.assignment.subject.title}</td>
                  <td><Link href={`/assignments/${s.assignmentId}`} className="font-medium hover:underline">{s.assignment.title}</Link></td>
                  <td className="whitespace-nowrap font-mono text-[11px] text-muted">{fmtDate(s.submittedAt, locale)}</td>
                  <td><StatusBadge status={s.status === "late" ? "late" : "onTime"} t={t} /></td>
                  <td>{s.grade ? <ScoreBadge score={s.grade.score} /> : <StatusBadge status="pending" t={t} />}</td>
                  <td className="max-w-xs text-muted">{s.grade?.comment ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <aside>
        {bySubject.size > 0 && (
          <div className="card">
            <p className="label border-b border-line px-4 py-2.5">{t("common.subjects")}</p>
            <ul className="divide-y divide-line">
              {[...bySubject.entries()].map(([id, r]) => (
                <li key={id} className="flex items-center justify-between px-4 py-2 text-[13px]">
                  <span className="truncate text-fg-2">{r.title}</span>
                  <span className="display font-bold tabular-nums">{(r.scores.reduce((a, b) => a + b, 0) / r.scores.length).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
