import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deadlineStripe, fmtDate, isPast, monogram } from "@/lib/format";
import { getT } from "@/i18n/server";
import { ScoreBadge, StatusBadge } from "@/components/StatusBadge";
import { EnrollForm } from "./EnrollForm";

export default async function StudentDashboard() {
  const me = await requireUser("student");
  const { t, locale } = await getT();
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: me.id },
    include: {
      subject: {
        include: {
          teacher: { select: { name: true } },
          assignments: { orderBy: { deadline: "asc" }, include: { submissions: { where: { studentId: me.id }, include: { grade: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const all = enrollments.flatMap((e) => e.subject.assignments);
  const pending = all.filter((a) => !a.submissions[0] && !isPast(a.deadline)).length;
  const overdue = all.filter((a) => !a.submissions[0] && isPast(a.deadline)).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
          <div>
            <p className="eyebrow">{t("common.student")}</p>
            <h1 className="h1">{t("student.mySubjects")}</h1>
          </div>
          <div className="flex gap-4 text-xs text-muted">
            <span>{t("status.notSubmitted")}: <b className="display text-base text-fg">{pending}</b></span>
            <span>{t("status.overdue")}: <b className={`display text-base ${overdue ? "text-danger" : "text-fg"}`}>{overdue}</b></span>
          </div>
        </div>

        {enrollments.length === 0 && <div className="card p-10 text-center text-muted">{t("student.notEnrolled")}</div>}

        <div className="space-y-3">
          {enrollments.map(({ subject: s }) => (
            <article key={s.id} className="card card-hover">
              <div className="flex items-start gap-4 p-4">
                <span className="display w-10 shrink-0 text-[28px] font-bold leading-none text-muted/50">{monogram(s.title)}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/subjects/${s.id}`} className="display text-[17px] font-bold hover:underline">{s.title}</Link>
                  <p className="text-xs text-muted">{t("student.teacher")}: {s.teacher.name}</p>
                </div>
                <Link href={`/subjects/${s.id}`} className="btn-secondary">{t("common.open")}</Link>
              </div>
              {s.assignments.length === 0 ? (
                <p className="border-t border-line px-4 py-2 text-xs text-muted">{t("student.noAssignments")}</p>
              ) : (
                <ul className="divide-y divide-line border-t border-line">
                  {s.assignments.map((a) => {
                    const sub = a.submissions[0];
                    const late = !sub && isPast(a.deadline);
                    return (
                      <li key={a.id} className={`stripe flex flex-wrap items-center justify-between gap-2 px-4 py-2 ${deadlineStripe(a.deadline, { submitted: !!sub })} ${late ? "bg-danger-soft/30" : ""}`}>
                        <Link href={`/assignments/${a.id}`} className="text-[13px] font-medium hover:underline">{a.title}</Link>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={`font-mono text-[11px] tabular-nums ${late ? "text-danger" : "text-muted"}`}>{fmtDate(a.deadline, locale)}</span>
                          {sub ? (
                            <>
                              <StatusBadge status={sub.status === "late" ? "submittedLate" : "submittedOnTime"} t={t} />
                              {sub.grade ? <ScoreBadge score={sub.grade.score} /> : <StatusBadge status="pending" t={t} />}
                            </>
                          ) : late ? (
                            <StatusBadge status="overdue" t={t} />
                          ) : (
                            <Link href={`/assignments/${a.id}`} className="btn-primary h-6 px-2 text-[11px]">{t("status.submit")}</Link>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
      <aside>
        <div className="card p-4">
          <h2 className="h2">{t("student.enroll")}</h2>
          <p className="mb-3 text-[11px] text-muted">{t("student.enrollHint")}</p>
          <EnrollForm />
        </div>
      </aside>
    </div>
  );
}
