import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/i18n/server";

export default async function GradebookPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const me = await requireUser("teacher");
  const { t } = await getT();
  const { subject: subjectId } = await searchParams;
  const subjects = await prisma.subject.findMany({ where: { teacherId: me.id }, orderBy: { title: "asc" } });
  const current = subjects.find((s) => s.id === subjectId) ?? subjects[0];
  if (!current) return <div className="card p-6 text-muted">{t("gradebook.needSubject")}</div>;

  const [assignments, enrollments] = await Promise.all([
    prisma.assignment.findMany({ where: { subjectId: current.id }, orderBy: { deadline: "asc" }, include: { submissions: { include: { grade: true } } } }),
    prisma.enrollment.findMany({ where: { subjectId: current.id }, include: { student: true }, orderBy: { student: { name: "asc" } } }),
  ]);
  const cell = new Map<string, { score?: number; late: boolean; subId: string }>();
  for (const a of assignments) for (const s of a.submissions) cell.set(`${a.id}:${s.studentId}`, { score: s.grade?.score, late: s.status === "late", subId: s.id });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="eyebrow">{current.title}</p>
          <h1 className="h1">{t("gradebook.title")}</h1>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => <Link key={s.id} href={`/teacher/gradebook?subject=${s.id}`} className={s.id === current.id ? "chip-on" : "chip-off"}>{s.title}</Link>)}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-64 bg-surface-2">{t("gradebook.student")}</th>
              {assignments.map((a) => <th key={a.id} className="w-36 whitespace-nowrap text-center"><Link href={`/assignments/${a.id}`} className="hover:underline">{a.title}</Link></th>)}
              <th className="w-24 text-right">{t("gradebook.average")}</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 && <tr><td colSpan={assignments.length + 2} className="py-10 text-center text-muted">{t("gradebook.noStudents")}</td></tr>}
            {enrollments.map((e) => {
              const scores: number[] = [];
              return (
                <tr key={e.id}>
                  <td className="sticky left-0 z-10 bg-surface font-medium">{e.student.name}<div className="text-[11px] font-normal text-muted">{e.student.email}</div></td>
                  {assignments.map((a) => {
                    const c = cell.get(`${a.id}:${e.studentId}`);
                    if (c?.score) scores.push(c.score);
                    return (
                      <td key={a.id} className="text-center">
                        {!c ? <span className="text-line-2">—</span> : (
                          <Link href={`/assignments/${a.id}#sub-${c.subId}`} title={c.late ? t("gradebook.lateTip") : t("gradebook.onTimeTip")}
                            className={`display inline-flex h-7 min-w-8 items-center justify-center rounded-[3px] border px-1.5 text-[13px] font-bold tabular-nums transition-colors ${
                              c.score ? (c.late ? "border-warn/40 bg-warn-soft text-warn" : "border-line-2 bg-surface-2 text-fg") : "border-dashed border-line-2 text-muted hover:border-fg hover:text-fg"}`}>
                            {c.score ?? "?"}
                          </Link>
                        )}
                      </td>
                    );
                  })}
                  <td className="display text-right font-bold tabular-nums">{scores.length ? (scores.reduce((x, y) => x + y, 0) / scores.length).toFixed(2) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted">
        <span><span className="kbd">n</span> {t("gradebook.legendOnTime")}</span>
        <span><span className="kbd text-warn">n</span> {t("gradebook.legendLate")}</span>
        <span><span className="kbd border-dashed">?</span> {t("gradebook.legendPending")}</span>
      </div>
    </div>
  );
}
