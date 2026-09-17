import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deadlineStripe, fmtDate, isPast } from "@/lib/format";
import { getT } from "@/i18n/server";
import { ScoreBadge, StatusBadge } from "@/components/StatusBadge";
import { CreateAssignmentForm } from "../../teacher/forms";
import { AddStudentForm } from "./AddStudentForm";

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { t, locale } = await getT();
  const { id } = await params;
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      teacher: { select: { name: true, email: true } },
      enrollments: { include: { student: { select: { id: true, name: true, email: true } } }, orderBy: { student: { name: "asc" } } },
      assignments: {
        orderBy: { deadline: "asc" },
        include: {
          _count: { select: { submissions: true } },
          submissions: me.role === "student" ? { where: { studentId: me.id }, include: { grade: true } } : { include: { grade: true } },
        },
      },
    },
  });
  if (!subject) notFound();
  const isTeacher = me.role === "teacher" && subject.teacherId === me.id;
  const isEnrolled = subject.enrollments.some((e) => e.studentId === me.id);
  if (!isTeacher && !isEnrolled) notFound();
  const active = subject.assignments.filter((a) => !isPast(a.deadline)).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        {/* Header: thin accent rule + large title on a neutral ground */}
        <header className="border-t-2 border-fg pt-4">
          <p className="eyebrow">{t("common.subject")} · {t("student.teacher")}: <span className="text-fg-2">{subject.teacher.name}</span></p>
          <h1 className="display mt-1 text-[32px] font-bold leading-[1.05] md:text-[40px]">{subject.title}</h1>
          <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:max-w-md">
            <div className="bg-surface px-3 py-2"><dt className="label mb-0">{t("common.students")}</dt><dd className="display text-xl font-bold">{subject.enrollments.length}</dd></div>
            <div className="bg-surface px-3 py-2"><dt className="label mb-0">{t("common.assignments")}</dt><dd className="display text-xl font-bold">{subject.assignments.length} <span className="text-xs font-medium text-muted">/ {active}</span></dd></div>
            <div className="bg-surface px-3 py-2"><dt className="label mb-0">{t("teacher.joinCode")}</dt><dd className="font-mono text-base font-semibold tracking-wider">{isTeacher ? subject.joinCode : "••••••"}</dd></div>
          </dl>
        </header>

        <div className="mb-2 mt-8 flex items-baseline justify-between">
          <h2 className="h2">{t("subject.homeworks")}</h2>
          <span className="text-[11px] text-muted">{subject.assignments.length}</span>
        </div>
        {subject.assignments.length === 0 && <div className="card p-8 text-center text-muted">{t("subject.noAssignments")}</div>}
        <ul className="space-y-2">
          {subject.assignments.map((a) => {
            const past = isPast(a.deadline);
            const mine = a.submissions.find((s) => s.studentId === me.id);
            const graded = a.submissions.filter((s) => s.grade).length;
            const overdue = !isTeacher && !mine && past;
            return (
              <li key={a.id}>
                <Link href={`/assignments/${a.id}`} className={`card card-hover stripe block px-4 py-3 ${deadlineStripe(a.deadline, { submitted: !!mine, muteWhenPast: isTeacher })}`}>
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold">{a.title}</p>
                      {a.description && <p className="line-clamp-1 text-xs text-muted">{a.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isTeacher ? (
                        <span className="badge-neutral">{t("status.gradedCount", { n: a._count.submissions, m: graded })}</span>
                      ) : mine ? (
                        <>
                          <StatusBadge status={mine.status === "late" ? "submittedLate" : "submittedOnTime"} t={t} />
                          {mine.grade ? <ScoreBadge score={mine.grade.score} /> : <StatusBadge status="pending" t={t} />}
                        </>
                      ) : (
                        <StatusBadge status={overdue ? "overdue" : "notSubmitted"} t={t} />
                      )}
                      <span className={`font-mono text-[11px] tabular-nums ${overdue ? "text-danger" : "text-muted"}`}>{fmtDate(a.deadline, locale)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="space-y-4 lg:pt-4">
        {isTeacher ? (
          <>
            <div className="card p-4">
              <h2 className="h2 mb-3">{t("teacher.createAssignment")}</h2>
              <CreateAssignmentForm subjects={[]} fixedSubjectId={subject.id} />
            </div>
            <div className="card">
              <div className="flex items-baseline justify-between border-b border-line px-4 py-2.5">
                <h2 className="h2">{t("teacher.students")}</h2><span className="font-mono text-[11px] text-muted">{subject.enrollments.length}</span>
              </div>
              <ul className="max-h-64 divide-y divide-line overflow-auto text-[13px]">
                {subject.enrollments.map((e) => (
                  <li key={e.id} className="px-4 py-1.5"><span className="font-medium">{e.student.name}</span><span className="block truncate text-[11px] text-muted">{e.student.email}</span></li>
                ))}
              </ul>
              <div className="border-t border-line p-3"><AddStudentForm subjectId={subject.id} /></div>
            </div>
          </>
        ) : (
          <div className="card p-4 text-[13px]">
            <p className="text-muted">{t("student.studentsOnCourse", { n: subject.enrollments.length })}</p>
            <Link href={`/student/leaderboard?subject=${subject.id}`} className="btn-secondary mt-3 w-full">{t("student.ratingBySubject")}</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
