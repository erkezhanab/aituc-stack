import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, isPast } from "@/lib/format";
import { getT } from "@/i18n/server";
import { PdfViewer } from "@/components/PdfViewer";
import { GradeForm } from "@/components/GradeForm";
import { ScoreBadge, StatusBadge } from "@/components/StatusBadge";
import { SubmitForm } from "./SubmitForm";

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { t, locale } = await getT();
  const { id } = await params;
  const a = await prisma.assignment.findUnique({
    where: { id },
    include: {
      subject: { include: { teacher: { select: { name: true } }, enrollments: { where: { studentId: me.id } } } },
      submissions: {
        where: me.role === "student" ? { studentId: me.id } : undefined,
        include: { grade: true, student: { select: { id: true, name: true, email: true } } },
        orderBy: { submittedAt: "asc" },
      },
    },
  });
  if (!a) notFound();
  const isTeacher = me.role === "teacher" && a.subject.teacherId === me.id;
  if (!isTeacher && a.subject.enrollments.length === 0) notFound();
  const past = isPast(a.deadline);
  const mine = a.submissions[0];

  return (
    <div className="space-y-6">
      <header className={`border-t-2 pt-4 ${past ? "border-danger" : "border-fg"}`}>
        <Link href={`/subjects/${a.subjectId}`} className="eyebrow hover:text-fg">← {a.subject.title}</Link>
        <h1 className="display mt-1 text-[30px] font-bold leading-tight md:text-[36px]">{a.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>{a.subject.teacher.name}</span>
          <span className={`font-mono tabular-nums ${past ? "font-semibold text-danger" : "text-fg"}`}>{t("common.deadline")}: {fmtDate(a.deadline, locale)} {past && t("subject.deadlinePassed")}</span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="space-y-3">
          <div className="card p-4">
            <p className="label">{t("assignment.description")}</p>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{a.description || "—"}</p>
            <p className="mt-3 border-t border-line pt-2 font-mono text-[11px] text-muted">{t("assignment.taskFile", { name: a.fileName, date: fmtDate(a.createdAt, locale) })}</p>
          </div>
          <PdfViewer src={`/api/files/assignment/${a.id}`} height={560} />
        </div>

        <div className="space-y-3">
          {!isTeacher && (
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="h2">{t("assignment.mySubmission")}</h2>
                {mine && <StatusBadge status={mine.status === "late" ? "late" : "onTime"} t={t} />}
              </div>
              {mine ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted">
                    <a className="link" href={`/api/files/submission/${mine.id}?v=original`}>{mine.originalName}</a> · <span className="font-mono">{fmtDate(mine.submittedAt, locale)}</span>
                  </p>
                  {mine.grade ? (
                    <div className="grid grid-cols-[auto_1fr] gap-4 border-y border-line py-3">
                      <span className="display text-[44px] font-bold leading-none tabular-nums">{mine.grade.score}<span className="text-base text-muted">/12</span></span>
                      <div className="text-[13px]">
                        {mine.grade.comment ? <p>{mine.grade.comment}</p> : <p className="text-muted">—</p>}
                        <p className="mt-1 font-mono text-[11px] text-muted">{fmtDate(mine.grade.gradedAt, locale)}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="stripe border-l-line-2 bg-surface-2 px-3 py-1.5 text-xs text-fg-2">{past ? t("assignment.pendingNoteLate") : t("assignment.pendingNote")}</p>
                      <SubmitForm assignmentId={a.id} />
                    </>
                  )}
                  <PdfViewer src={`/api/files/submission/${mine.id}`} height={420} />
                </div>
              ) : (
                <div className="space-y-3">
                  {past && <p className="stripe border-l-danger bg-danger-soft/60 px-3 py-1.5 text-xs text-danger">{t("assignment.deadlinePassedNote")}</p>}
                  <SubmitForm assignmentId={a.id} />
                </div>
              )}
            </div>
          )}

          {isTeacher && (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between"><h2 className="h2">{t("assignment.submissions", { n: a.submissions.length })}</h2></div>
              {a.submissions.length === 0 && <div className="card p-6 text-center text-xs text-muted">{t("assignment.noSubmissions")}</div>}
              {a.submissions.map((s) => (
                <details key={s.id} id={`sub-${s.id}`} className={`card stripe scroll-mt-20 ${s.grade ? "border-l-line-2" : s.status === "late" ? "border-l-warn" : "border-l-fg"}`} open={!s.grade}>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                    <span className="text-[13px] font-semibold">{s.student.name} <span className="font-normal text-muted">{s.student.email}</span></span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted">{fmtDate(s.submittedAt, locale)}</span>
                      <StatusBadge status={s.status === "late" ? "late" : "onTime"} t={t} />
                      {s.grade ? <ScoreBadge score={s.grade.score} /> : <StatusBadge status="notGraded" t={t} />}
                    </span>
                  </summary>
                  <div className="space-y-3 border-t border-line px-4 py-3">
                    <p className="text-[11px] text-muted">
                      <a className="link" href={`/api/files/submission/${s.id}?v=original`}>{s.originalName}</a>
                      {s.originalPath !== s.pdfPath && <span> {t("assignment.docxConverted")}</span>}
                    </p>
                    <PdfViewer src={`/api/files/submission/${s.id}`} height={420} />
                    <GradeForm submissionId={s.id} score={s.grade?.score} comment={s.grade?.comment} />
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
