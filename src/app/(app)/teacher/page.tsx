import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deadlineStripe, fmtDate, monogram } from "@/lib/format";
import { getT } from "@/i18n/server";
import { CreateSubjectForm, CreateAssignmentForm } from "./forms";

export default async function TeacherDashboard() {
  const me = await requireUser("teacher");
  const { t, locale } = await getT();
  const subjects = await prisma.subject.findMany({
    where: { teacherId: me.id },
    include: {
      _count: { select: { enrollments: true, assignments: true } },
      assignments: { orderBy: { deadline: "desc" }, take: 3, include: { _count: { select: { submissions: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <div className="mb-4 flex items-end justify-between border-b border-line pb-3">
          <div>
            <p className="eyebrow">{t("common.teacher")}</p>
            <h1 className="h1">{t("teacher.mySubjects")}</h1>
          </div>
          <a href="#create-assignment" className="btn-accent">{t("teacher.createAssignment")}</a>
        </div>

        {subjects.length === 0 && <div className="card p-10 text-center text-muted">{t("teacher.noSubjects")}</div>}

        <div className="space-y-3">
          {subjects.map((s, i) => (
            <article key={s.id} className="card card-hover">
              <div className="flex items-start gap-4 p-4">
                <span className="display w-10 shrink-0 text-[28px] font-bold leading-none text-muted/50">{monogram(s.title)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/subjects/${s.id}`} className="display text-[17px] font-bold hover:underline">{s.title}</Link>
                    <span className="font-mono text-[11px] text-muted">#{String(subjects.length - i).padStart(2, "0")}</span>
                  </div>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                    <span>{t("common.students")}: <b className="text-fg-2">{s._count.enrollments}</b></span>
                    <span>{t("common.assignments")}: <b className="text-fg-2">{s._count.assignments}</b></span>
                    <span>{t("teacher.joinCode")}: <code className="kbd">{s.joinCode}</code></span>
                  </p>
                </div>
                <Link href={`/subjects/${s.id}`} className="btn-secondary">{t("common.open")}</Link>
              </div>
              {s.assignments.length > 0 && (
                <ul className="divide-y divide-line border-t border-line">
                  {s.assignments.map((a) => (
                    <li key={a.id} className={`stripe flex items-center justify-between gap-3 px-4 py-2 ${deadlineStripe(a.deadline, { muteWhenPast: true })}`}>
                      <Link href={`/assignments/${a.id}`} className="truncate text-[13px] font-medium hover:underline">{a.title}</Link>
                      <span className="flex shrink-0 items-center gap-3 text-[11px] text-muted">
                        <span>{t("teacher.submissionsCount", { n: a._count.submissions })}</span>
                        <span className="font-mono tabular-nums">{fmtDate(a.deadline, locale)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <div id="create-assignment" className="card p-4">
          <h2 className="h2 mb-3">{t("teacher.createAssignment")}</h2>
          {subjects.length === 0 ? (
            <p className="text-xs text-muted">{t("teacher.createSubjectFirst")}</p>
          ) : (
            <CreateAssignmentForm subjects={subjects.map((s) => ({ id: s.id, title: s.title }))} />
          )}
        </div>
        <div id="create-subject" className="card p-4">
          <h2 className="h2 mb-3">{t("teacher.createSubject")}</h2>
          <CreateSubjectForm />
        </div>
        <p className="px-1 text-[11px] leading-snug text-muted">{t("teacher.inviteCodeNote")}</p>
      </aside>
    </div>
  );
}
