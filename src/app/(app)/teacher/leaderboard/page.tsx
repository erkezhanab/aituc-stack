import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { computeLeaderboard } from "@/lib/rating";
import { getT } from "@/i18n/server";
import { Leaderboard } from "@/components/Leaderboard";

export default async function TeacherLeaderboard({ searchParams }: { searchParams: Promise<{ subject?: string; period?: string }> }) {
  const me = await requireUser("teacher");
  const { t } = await getT();
  const sp = await searchParams;
  const subjects = await prisma.subject.findMany({ where: { teacherId: me.id }, select: { id: true, title: true }, orderBy: { title: "asc" } });
  const subjectId = subjects.some((s) => s.id === sp.subject) ? sp.subject : undefined;
  const period = sp.period === "month" ? "month" : "all";
  const rows = await computeLeaderboard({ subjectIds: subjects.map((s) => s.id), subjectId, period });
  return (
    <div className="space-y-4">
      <div className="border-b border-line pb-3">
        <p className="eyebrow">{t("common.teacher")}</p>
        <h1 className="h1">{t("lb.titleTeacher")}</h1>
      </div>
      <Leaderboard rows={rows} subjects={subjects} filters={{ subjectId, period }} basePath="/teacher/leaderboard" t={t} />
    </div>
  );
}
